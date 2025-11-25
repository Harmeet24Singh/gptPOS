import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for processing payment
export const processPayment = createAsyncThunk(
  'cart/processPayment',
  async ({ cart, paymentData }, { rejectWithValue }) => {
    try {
      const transaction = {
        timestamp: new Date().toISOString(),
        items: cart.map((c) => ({
          id: c.id,
          name: c.name,
          quantity: c.quantity,
          price: c.price,
          applyTax: c.applyTax,
        })),
        ...paymentData
      };

      const response = await fetch('/api/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'dev-secret',
        },
        body: JSON.stringify(transaction),
      });

      const data = await response.json();
      
      if (data && data.transaction) {
        return { id: data.id, ...data.transaction };
      } else {
        throw new Error('Failed to process transaction');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    cashAmount: 0,
    cardAmount: 0,
    autoFillOther: true,
    lastEdited: null, // 'cash' | 'card' | null
    paymentError: null,
    showReceipt: false,
    lastTransaction: null,
    processing: false,
  },
  reducers: {
    addToCart: (state, action) => {
      const product = action.payload;
      const existingItem = state.items.find(item => item.id === product.id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({
          ...product,
          quantity: 1,
          applyTax: product.taxable, // Default to product's tax setting
        });
      }
    },
    removeFromCart: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(item => item.id !== productId);
    },
    updateCartQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter(item => item.id !== productId);
      } else {
        const item = state.items.find(item => item.id === productId);
        if (item) {
          item.quantity = quantity;
        }
      }
    },
    toggleItemTax: (state, action) => {
      const productId = action.payload;
      const item = state.items.find(item => item.id === productId);
      if (item) {
        item.applyTax = !item.applyTax;
      }
    },
    setCashAmount: (state, action) => {
      state.cashAmount = action.payload;
      state.lastEdited = 'cash';
      state.paymentError = null;
    },
    setCardAmount: (state, action) => {
      state.cardAmount = action.payload;
      state.lastEdited = 'card';
      state.paymentError = null;
    },
    setAutoFillOther: (state, action) => {
      state.autoFillOther = action.payload;
    },
    setPaymentError: (state, action) => {
      state.paymentError = action.payload;
    },
    clearCart: (state) => {
      state.items = [];
      state.cashAmount = 0;
      state.cardAmount = 0;
      state.paymentError = null;
    },
    startNewSale: (state) => {
      state.showReceipt = false;
      state.lastTransaction = null;
      state.items = [];
      state.cashAmount = 0;
      state.cardAmount = 0;
      state.paymentError = null;
    },
    // Auto-fill payment amounts based on cart total
    autoFillPayments: (state, action) => {
      const { total } = action.payload;
      if (state.autoFillOther && state.lastEdited) {
        if (state.lastEdited === 'cash') {
          const newCard = Math.max(0, +(total - state.cashAmount).toFixed(2));
          state.cardAmount = newCard;
        } else if (state.lastEdited === 'card') {
          const newCash = Math.max(0, +(total - state.cardAmount).toFixed(2));
          state.cashAmount = newCash;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(processPayment.pending, (state) => {
        state.processing = true;
        state.paymentError = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.processing = false;
        state.lastTransaction = action.payload;
        state.showReceipt = true;
        state.items = [];
        state.cashAmount = 0;
        state.cardAmount = 0;
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.processing = false;
        state.paymentError = action.payload;
      });
  },
});

export const {
  addToCart,
  removeFromCart,
  updateCartQuantity,
  toggleItemTax,
  setCashAmount,
  setCardAmount,
  setAutoFillOther,
  setPaymentError,
  clearCart,
  startNewSale,
  autoFillPayments,
} = cartSlice.actions;

export default cartSlice.reducer;