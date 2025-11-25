"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../lib/auth";
import { useInventoryManager, useAppDispatch } from "../lib/hooks";
import { useEnsureInventory } from "../lib/withInventory";
import { updateItemStock, deleteInventoryItem, loadInventory } from "../lib/slices/inventorySlice";
import {
  Container,
  Title,
  SearchBar,
  Table,
  Button,
  Badge,
  ActionButtons,
  FilterContainer,
  Select,
} from "../styles/inventoryStyles";

// Inventory management page - now uses Redux for centralized state management

export default function InventoryPage() {
  const auth = useAuth();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, loading, error, categories, getFilteredInventory, isDataStale } = useInventoryManager();
  const { inventoryLoading, inventoryError, inventoryLoaded } = useEnsureInventory();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    // If not logged in, redirect to POS
    if (!auth || !auth.user) {
      router.push("/pos");
    }
  }, [auth, router]);

  // Auto-refresh when page becomes visible (e.g., when coming back from add item page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && auth?.user) {
        console.log("Page became visible, checking if refresh needed...");
        // Always refresh when page becomes visible to catch any updates
        console.log("Refreshing inventory due to visibility change...");
        dispatch(loadInventory(true));
      }
    };

    const handleFocus = () => {
      if (auth?.user) {
        console.log("Window focused, checking if refresh needed...");
        // Always refresh on focus to catch updates from other tabs/windows
        console.log("Refreshing inventory due to window focus...");
        dispatch(loadInventory(true));
      }
    };

    // Use both visibilitychange and focus events for better coverage
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [auth?.user, dispatch]);

  // Also refresh when component mounts if no data
  useEffect(() => {
    if (auth?.user && items.length === 0) {
      console.log("Component mounted with no items, loading inventory...");
      dispatch(loadInventory(true));
    }
  }, [auth?.user, items.length, dispatch]);

  // Periodic refresh as fallback (every 30 seconds)
  useEffect(() => {
    if (!auth?.user) return;

    const interval = setInterval(() => {
      if (isDataStale()) {
        console.log("Data is stale, refreshing inventory...");
        dispatch(loadInventory(true));
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [auth?.user, dispatch, isDataStale]);

  // If not authenticated, don't show anything while redirecting
  if (!auth || !auth.user) {
    return null;
  }

  const filteredInventory = getFilteredInventory(searchTerm, categoryFilter);

  const updateStock = async (id, newStock) => {
    try {
      await dispatch(updateItemStock({ id, newStock })).unwrap();
    } catch (error) {
      console.error("Failed to update stock:", error);
      // Use console.error instead of alert to prevent page shift
      console.error("Stock update failed for item ID:", id, "Error:", error);
    }
  };

  const deleteItem = async (id) => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        await dispatch(deleteInventoryItem(id)).unwrap();
      } catch (error) {
        console.error("Failed to delete item:", error);
        // Use console.error instead of alert to prevent page shift
        console.error("Delete failed for item ID:", id, "Error:", error);
      }
    }
  };

  const refreshInventory = async () => {
    try {
      await dispatch(loadInventory(true)).unwrap(); // Force refresh from database
      console.log("Inventory refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh inventory:", error);
      alert("Failed to refresh inventory: " + error);
    }
  };

  return (
    <Container>
      <Title>Inventory Management</Title>
      
      {/* Inventory Statistics */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Total Items */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '1.25rem',
          borderRadius: '8px',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                📦 Total Items
              </h3>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '0.85rem' }}>
                {searchTerm || categoryFilter ? 'Filtered' : 'All items'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 'bold', lineHeight: 1 }}>
                {filteredInventory.length}
              </div>
              {(searchTerm || categoryFilter) && (
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                  of {items.length}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Items */}
        <div style={{ 
          background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
          color: 'white',
          padding: '1.25rem',
          borderRadius: '8px',
          boxShadow: '0 4px 15px rgba(243, 156, 18, 0.4)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                ⚠️ Low Stock
              </h3>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '0.85rem' }}>
                Items needing restock
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 'bold', lineHeight: 1 }}>
                {filteredInventory.filter(item => item.stock <= item.lowStockThreshold).length}
              </div>
            </div>
          </div>
        </div>

        {/* Total Value */}
        <div style={{ 
          background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
          color: 'white',
          padding: '1.25rem',
          borderRadius: '8px',
          boxShadow: '0 4px 15px rgba(39, 174, 96, 0.4)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                💰 Total Value
              </h3>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '0.85rem' }}>
                Inventory worth
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', lineHeight: 1 }}>
                ${filteredInventory.reduce((total, item) => total + (item.price * item.stock), 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Categories Count */}
        <div style={{ 
          background: 'linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)',
          color: 'white',
          padding: '1.25rem',
          borderRadius: '8px',
          boxShadow: '0 4px 15px rgba(142, 68, 173, 0.4)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                🏷️ Categories
              </h3>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '0.85rem' }}>
                Product categories
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 'bold', lineHeight: 1 }}>
                {categories.length}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {(loading || inventoryLoading) && (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#3498db' }}>
          <p>Loading inventory...</p>
        </div>
      )}
      
      {(error || inventoryError) && (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#e74c3c' }}>
          <p>Error loading inventory: {error || inventoryError}</p>
          <p style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
            Using cached data if available
          </p>
        </div>
      )}

      <FilterContainer>
        <SearchBar
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
        <Link href="/categories">
          <Button style={{ background: "#3498db", marginRight: "1rem" }}>
            Manage Categories
          </Button>
        </Link>
        <Link href="/inventory/add">
          <Button>Add New Item</Button>
        </Link>
        <Button 
          onClick={refreshInventory}
          disabled={loading}
          style={{ 
            backgroundColor: loading ? '#95a5a6' : '#27ae60',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
        </Button>
      </FilterContainer>

      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Product ID/Barcode</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Taxable</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredInventory.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>
                <span style={{
                  fontFamily: 'monospace',
                  backgroundColor: '#ecf0f1', 
                  padding: '0.2rem 0.4rem', 
                  borderRadius: '3px',
                  fontSize: '0.85rem'
                }}>
                  {item.barcode || item.id}
                </span>
                {!item.barcode && (
                  <small style={{ 
                    color: '#7f8c8d', 
                    fontSize: '0.7rem', 
                    marginLeft: '0.5rem' 
                  }}>
                    (Product ID)
                  </small>
                )}
              </td>
              <td>{item.category}</td>
              <td>${item.price.toFixed(2)}</td>
              <td style={{ color: item.stock < 0 ? '#ff4444' : 'inherit' }}>
                {item.stock}
                {item.stock < 0 && <span style={{ fontSize: '0.8em', marginLeft: '4px' }}>(Negative Stock)</span>}
              </td>
              <td>
                <Badge $isLow={item.stock < 0 ? true : item.stock <= item.lowStockThreshold}>
                  {item.stock < 0
                    ? "Negative Stock"
                    : item.stock <= item.lowStockThreshold
                    ? "Low Stock"
                    : "In Stock"}
                </Badge>
              </td>
              <td>
                <Badge
                  $isLow={false}
                  style={{ background: item.taxable ? "#27ae60" : "#95a5a6" }}
                >
                  {item.taxable ? "HST" : "No HST"}
                </Badge>
              </td>
              <td>
                <ActionButtons>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateStock(item.id, item.stock + 1);
                    }}
                  >
                    +1
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateStock(item.id, item.stock - 1);
                    }}
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteItem(item.id);
                    }}
                    style={{ background: "#e74c3c" }}
                  >
                    Delete
                  </button>
                </ActionButtons>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}
