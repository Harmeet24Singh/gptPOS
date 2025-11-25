"use client";

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  inventory: {
    data: null,
    timestamp: null,
  },
  categories: {
    data: null,
    timestamp: null,
  },
  users: {
    data: null,
    timestamp: null,
  },
  transactions: {
    data: null,
    timestamp: null,
  },
};

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

export const apiCacheSlice = createSlice({
  name: "apiCache",
  initialState,
  reducers: {
    setInventoryData: (state, action) => {
      state.inventory = {
        data: action.payload,
        timestamp: Date.now(),
      };
    },
    setCategoriesData: (state, action) => {
      state.categories = {
        data: action.payload,
        timestamp: Date.now(),
      };
    },
    setUsersData: (state, action) => {
      state.users = {
        data: action.payload,
        timestamp: Date.now(),
      };
    },
    setTransactionsData: (state, action) => {
      state.transactions = {
        data: action.payload,
        timestamp: Date.now(),
      };
    },
    invalidateCache: (state) => {
      return initialState;
    },
  },
});

// Action creators
export const {
  setInventoryData,
  setCategoriesData,
  setUsersData,
  setTransactionsData,
  invalidateCache,
} = apiCacheSlice.actions;

// Selectors
export const selectInventoryData = (state) => {
  if (
    !state.apiCache.inventory.data ||
    Date.now() - state.apiCache.inventory.timestamp > CACHE_EXPIRATION
  ) {
    return null;
  }
  return state.apiCache.inventory.data;
};

export const selectCategoriesData = (state) => {
  if (
    !state.apiCache.categories.data ||
    Date.now() - state.apiCache.categories.timestamp > CACHE_EXPIRATION
  ) {
    return null;
  }
  return state.apiCache.categories.data;
};

export const selectUsersData = (state) => {
  if (
    !state.apiCache.users.data ||
    Date.now() - state.apiCache.users.timestamp > CACHE_EXPIRATION
  ) {
    return null;
  }
  return state.apiCache.users.data;
};

export const selectTransactionsData = (state) => {
  if (
    !state.apiCache.transactions.data ||
    Date.now() - state.apiCache.transactions.timestamp > CACHE_EXPIRATION
  ) {
    return null;
  }
  return state.apiCache.transactions.data;
};

export default apiCacheSlice.reducer;
