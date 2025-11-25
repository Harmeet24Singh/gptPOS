'use client';

import { useEffect } from 'react';
import { useInventoryManager } from './hooks';
import { loadInventory } from './slices/inventorySlice';

// Higher-order component to ensure inventory is loaded
export function withInventory(WrappedComponent) {
  return function WithInventoryComponent(props) {
    const { items, loading, error, isDataStale, dispatch } = useInventoryManager();

    useEffect(() => {
      // Load inventory if:
      // 1. No items exist, OR
      // 2. Data is stale (older than 5 minutes), OR  
      // 3. There was an error
      if (items.length === 0 || isDataStale() || error) {
        console.log('withInventory: Loading inventory...', {
          hasItems: items.length > 0,
          isStale: isDataStale(),
          hasError: !!error
        });
        dispatch(loadInventory());
      }
    }, [items.length, isDataStale, error, dispatch]);

    // Pass inventory state as props
    return (
      <WrappedComponent 
        {...props} 
        inventoryLoading={loading}
        inventoryError={error}
        inventoryLoaded={items.length > 0}
      />
    );
  };
}

// Hook version for functional components
export function useEnsureInventory() {
  const { items, loading, error, isDataStale, dispatch } = useInventoryManager();

  useEffect(() => {
    if (items.length === 0 || isDataStale() || error) {
      console.log('useEnsureInventory: Loading inventory...', {
        hasItems: items.length > 0,
        isStale: isDataStale(),
        hasError: !!error
      });
      dispatch(loadInventory());
    }
  }, [items.length, isDataStale, error, dispatch]);

  return {
    inventoryLoading: loading,
    inventoryError: error,
    inventoryLoaded: items.length > 0,
  };
}