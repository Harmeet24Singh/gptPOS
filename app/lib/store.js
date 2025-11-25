import { configureStore } from '@reduxjs/toolkit';
import inventorySlice from './slices/inventorySlice';
import cartSlice from './slices/cartSlice';
import authSlice from './slices/authSlice';

export const store = configureStore({
  reducer: {
    inventory: inventorySlice,
    cart: cartSlice,
    auth: authSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for non-serializable values
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Export store types for usage in components
// RootState type: ReturnType<typeof store.getState>
// AppDispatch type: typeof store.dispatch