import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Initial inventory for seeding database
const initialInventory = [
  {
    id: 1,
    name: "Coca Cola 355ml",
    category: "Beverages",
    price: 1.5,
    stock: 24,
    lowStockThreshold: 10,
    taxable: true,
  },
  {
    id: 2,
    name: "Lays Classic Chips",
    category: "Snacks",
    price: 2.99,
    stock: 8,
    lowStockThreshold: 15,
    taxable: true,
  },
  {
    id: 3,
    name: "Wonder Bread",
    category: "Bakery",
    price: 3.49,
    stock: 12,
    lowStockThreshold: 5,
    taxable: false,
  },
  {
    id: 4,
    name: "Marlboro Gold",
    category: "Tobacco",
    price: 15.99,
    stock: 5,
    lowStockThreshold: 10,
    taxable: true,
  },
  {
    id: 5,
    name: "Red Bull 250ml",
    category: "Beverages",
    price: 3.99,
    stock: 18,
    lowStockThreshold: 8,
    taxable: true,
  },
];

// Async thunk for loading inventory from API with smart caching
export const loadInventory = createAsyncThunk(
  "inventory/loadInventory",
  async (forceRefresh = false, { getState, rejectWithValue }) => {
    try {
      // If we already have cached data and not forcing refresh, return it
      const currentState = getState().inventory;
      if (
        !forceRefresh &&
        currentState.items.length > 0 &&
        !currentState.error
      ) {
        return {
          source: currentState.source || "cached",
          data: currentState.items,
        };
      }

      console.log("Redux: Loading inventory from API...");

      // First try main inventory API
      let res = await fetch("/api/inventory");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          console.log(
            "Redux: Loaded inventory from database ✅",
            data.length,
            "items"
          );
          return { source: "database", data };
        } else {
          // Database is empty, seed it with initial data
          console.log(
            "Redux: Database empty, seeding with initial inventory..."
          );
          await fetch("/api/inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(initialInventory),
          });
          const seedRes = await fetch("/api/inventory");
          const seedData = await seedRes.json();
          console.log(
            "Redux: Seeded and loaded inventory ✅",
            seedData.length,
            "items"
          );
          return { source: "database", data: seedData };
        }
      }

      console.log("Redux: Database unavailable, trying localStorage...");

      // Fallback to localStorage
      const localInventory = localStorage.getItem("inventory");
      if (localInventory) {
        const parsed = JSON.parse(localInventory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(
            "Redux: Loaded inventory from localStorage ✅",
            parsed.length,
            "items"
          );
          return { source: "localStorage", data: parsed };
        }
      }

      console.log("Redux: Using fallback API...");

      // Final fallback to simple API
      res = await fetch("/api/inventory-simple");
      if (res.ok) {
        const data = await res.json();
        console.log("Redux: Using fallback inventory ✅", data.length, "items");
        return { source: "fallback", data };
      }

      throw new Error("No inventory data available from any source");
    } catch (error) {
      console.error("Redux: Failed to load inventory:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating inventory after transaction
export const updateInventoryAfterTransaction = createAsyncThunk(
  "inventory/updateAfterTransaction",
  async (cartItems, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/inventory");
      if (res.ok) {
        const data = await res.json();
        return data; // Return all inventory items, including those with 0 stock
      }
      throw new Error("Failed to refresh inventory");
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating stock of a single item
export const updateItemStock = createAsyncThunk(
  "inventory/updateItemStock",
  async ({ id, newStock }, { getState, rejectWithValue }) => {
    try {
      const currentState = getState().inventory;
      const updatedInventory = currentState.items.map((item) =>
        item.id === id ? { ...item, stock: newStock } : item
      );

      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "dev-secret",
        },
        body: JSON.stringify(updatedInventory),
      });

      if (!res.ok) {
        throw new Error("Failed to update stock on server");
      }

      return updatedInventory;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for deleting an item
export const deleteInventoryItem = createAsyncThunk(
  "inventory/deleteItem",
  async (id, { getState, rejectWithValue }) => {
    try {
      console.log("Redux: Deleting inventory item with ID:", id);

      const res = await fetch(`/api/inventory/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "dev-secret",
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.details ||
            errorData.error ||
            "Failed to delete item on server"
        );
      }

      // Return the filtered inventory (remove the deleted item from local state)
      const currentState = getState().inventory;
      const updatedInventory = currentState.items.filter(
        (item) => item.id !== id
      );

      console.log(
        "Redux: Successfully deleted item, updated inventory has",
        updatedInventory.length,
        "items"
      );
      return updatedInventory;
    } catch (error) {
      console.error("Redux: Failed to delete inventory item:", error);
      return rejectWithValue(error.message);
    }
  }
);

const inventorySlice = createSlice({
  name: "inventory",
  initialState: {
    items: [],
    loading: false,
    error: null,
    source: null, // 'database', 'localStorage', 'fallback', 'cached'
    lastLoaded: null, // timestamp of last successful load
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setInventoryItems: (state, action) => {
      state.items = action.payload;
      state.lastLoaded = new Date().toISOString();
    },
    // Local optimistic update for stock changes
    updateItemStockLocal: (state, action) => {
      const { id, newStock } = action.payload;
      const item = state.items.find((item) => item.id === id);
      if (item) {
        item.stock = newStock;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.source = action.payload.source;
        state.lastLoaded = new Date().toISOString();
      })
      .addCase(loadInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateInventoryAfterTransaction.fulfilled, (state, action) => {
        state.items = action.payload;
        state.lastLoaded = new Date().toISOString();
      })
      .addCase(updateItemStock.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateItemStock.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(updateItemStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteInventoryItem.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteInventoryItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(deleteInventoryItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setInventoryItems, updateItemStockLocal } =
  inventorySlice.actions;
export default inventorySlice.reducer;
