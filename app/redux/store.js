"use client";

import { configureStore } from "@reduxjs/toolkit";
import apiCacheReducer from "./slices/apiCacheSlice";

export const store = configureStore({
  reducer: {
    apiCache: apiCacheReducer,
  },
});
