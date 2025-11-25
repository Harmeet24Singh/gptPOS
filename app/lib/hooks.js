import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// Custom hooks for typed Redux usage
export const useAppSelector = useSelector;
export const useAppDispatch = () => useDispatch();

// Specific selector hooks for convenience
export const useAuth = () => useAppSelector((state) => state.auth);
export const useInventory = () => useAppSelector((state) => state.inventory);
export const useCart = () => useAppSelector((state) => state.cart);

// Enhanced inventory hook with helper functions
export const useInventoryManager = () => {
  const inventory = useInventory();
  const dispatch = useAppDispatch();
  const [categories, setCategories] = useState([]);

  // Load categories from MongoDB API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.map(cat => cat.name));
        } else {
          // Fallback to inventory-based categories
          setCategories([...new Set(inventory.items.map((item) => item.category))]);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
        // Fallback to inventory-based categories
        setCategories([...new Set(inventory.items.map((item) => item.category))]);
      }
    };
    
    loadCategories();
  }, [inventory.items]);
  
  const getFilteredInventory = (searchTerm = '', categoryFilter = '') => {
    // Enhanced debugging for specific barcodes
    const debugBarcodes = ['04257207521', '06190000013'];
    if (searchTerm && (searchTerm.length > 5 || debugBarcodes.includes(searchTerm))) {
      console.log(`=== DEBUGGING SEARCH FOR "${searchTerm}" ===`);
      console.log('Total inventory items:', inventory.items.length);
      console.log('Inventory source:', inventory.source || 'unknown');
      console.log('Last loaded:', inventory.lastLoaded || 'unknown');
      
      // Show first few items to understand data structure
      if (inventory.items.length > 0) {
        console.log('Sample inventory items:', inventory.items.slice(0, 2));
        console.log('Sample item keys:', Object.keys(inventory.items[0]));
      }
      
      // Look for ANY item with this barcode in ANY field
      const foundItems = inventory.items.filter(item => {
        const itemString = JSON.stringify(item);
        return itemString.toLowerCase().includes(searchTerm.toLowerCase());
      });
      
      console.log(`Items containing "${searchTerm}":`, foundItems);
      
      // Check each item's barcode fields specifically
      inventory.items.forEach((item, index) => {
        if (item.barcode && item.barcode.toString().includes(searchTerm)) {
          console.log(`✅ Item ${index} has matching primary barcode:`, item);
        }
        if (item.barcode2 && item.barcode2.toString().includes(searchTerm)) {
          console.log(`✅ Item ${index} has matching barcode2:`, item);
        }
        if (item.productId && item.productId.toString().includes(searchTerm)) {
          console.log(`✅ Item ${index} has matching productId:`, item);
        }
        if (item.id && item.id.toString().includes(searchTerm)) {
          console.log(`✅ Item ${index} has matching id:`, item);
        }
      });
    }
    
    return inventory.items.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      
      // Helper function to check all possible barcode fields
      const matchesAnyBarcode = (searchTerm) => {
        const barcodeFields = [
          'barcode', 'barcode2', 'barcode3', 'altBarcode', 'alternateBarcode',
          'upc', 'ean', 'gtin', 'isbn', 'sku', 'productCode'
        ];
        
        const matches = barcodeFields.some(field => {
          const value = item[field];
          const hasMatch = value && value.toString().includes(searchTerm);
          
          // Debug specific barcode checks
          if (debugBarcodes.includes(searchTerm) && hasMatch) {
            console.log(`🎯 BARCODE MATCH: item.${field} = "${value}" matches "${searchTerm}"`);
          }
          
          return hasMatch;
        });
        
        return matches;
      };
      
      const matchesSearch =
        item.name.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower) ||
        matchesAnyBarcode(searchTerm) ||
        (item.productId && item.productId.toString().includes(searchTerm)) ||
        (item.id && item.id.toString().includes(searchTerm));
      
      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      
      if (searchTerm === '04257207521' && matchesSearch) {
        console.log('FOUND MATCH:', item);
      }
      
      return matchesSearch && matchesCategory;
    });
  };

  const isDataStale = () => {
    if (!inventory.lastLoaded) return true;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(inventory.lastLoaded) < fiveMinutesAgo;
  };

  return {
    ...inventory,
    categories,
    getFilteredInventory,
    isDataStale,
    dispatch,
  };
};

// Cart calculation helpers
export const useCartCalculations = () => {
  const cart = useCart();
  
  const calculateTotal = () => {
    return cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const calculateTax = () => {
    return cart.items.reduce((tax, item) => {
      if (item.applyTax) {
        return tax + item.price * item.quantity * 0.13;
      }
      return tax;
    }, 0);
  };

  const getTaxableTotal = () => {
    return cart.items.reduce((total, item) => {
      if (item.applyTax) {
        return total + item.price * item.quantity;
      }
      return total;
    }, 0);
  };

  const getNonTaxableTotal = () => {
    return cart.items.reduce((total, item) => {
      if (!item.applyTax) {
        return total + item.price * item.quantity;
      }
      return total;
    }, 0);
  };

  const getCartSummary = () => {
    const subtotal = calculateTotal();
    const tax = calculateTax();
    const total = +(subtotal + tax).toFixed(2);
    const taxableAmount = getTaxableTotal();
    const nonTaxableAmount = getNonTaxableTotal();
    
    return {
      subtotal,
      tax,
      total,
      taxableAmount,
      nonTaxableAmount,
    };
  };

  return {
    calculateTotal,
    calculateTax,
    getTaxableTotal,
    getNonTaxableTotal,
    getCartSummary,
  };
};

export default {
  useAppSelector,
  useAppDispatch,
  useAuth,
  useInventory,
  useCart,
  useCartCalculations,
};