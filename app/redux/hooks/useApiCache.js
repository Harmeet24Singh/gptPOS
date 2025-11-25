"use client";

import { useDispatch, useSelector } from "react-redux";
import {
  setInventoryData,
  setCategoriesData,
  setUsersData,
  setTransactionsData,
  selectInventoryData,
  selectCategoriesData,
  selectUsersData,
  selectTransactionsData,
} from "./slices/apiCacheSlice";

export function useApiCache(endpoint) {
  const dispatch = useDispatch();

  // Select the appropriate selector based on the endpoint
  const selectData = (state) => {
    switch (endpoint) {
      case "/api/inventory":
        return selectInventoryData(state);
      case "/api/categories":
        return selectCategoriesData(state);
      case "/api/users":
        return selectUsersData(state);
      case "/api/transaction":
        return selectTransactionsData(state);
      default:
        return null;
    }
  };

  // Get cached data
  const cachedData = useSelector(selectData);

  // Function to update cache
  const updateCache = (data) => {
    switch (endpoint) {
      case "/api/inventory":
        dispatch(setInventoryData(data));
        break;
      case "/api/categories":
        dispatch(setCategoriesData(data));
        break;
      case "/api/users":
        dispatch(setUsersData(data));
        break;
      case "/api/transaction":
        dispatch(setTransactionsData(data));
        break;
      default:
        break;
    }
  };

  // Function to fetch data with caching
  const fetchWithCache = async () => {
    // If we have valid cached data, return it
    if (cachedData) {
      return cachedData;
    }

    // Otherwise, fetch fresh data
    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      // Update cache with new data
      updateCache(data);

      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  };

  return {
    data: cachedData,
    fetch: fetchWithCache,
    updateCache,
  };
}
