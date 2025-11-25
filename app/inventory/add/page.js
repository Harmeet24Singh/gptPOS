"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { useInventoryManager } from "../../lib/hooks";
import {
  Container,
  Title,
  FormContainer,
  FormGroup,
  ButtonContainer,
  SubmitButton,
  CancelButton,
} from "../../styles/inventoryStyles";

export default function AddItemPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { categories } = useInventoryManager();
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingProductId, setExistingProductId] = useState(null);
  const [existingProductData, setExistingProductData] = useState(null);
  const [barcodeCheckMessage, setBarcodeCheckMessage] = useState("");
  const [isCheckingBarcode, setIsCheckingBarcode] = useState(false);
  const [barcodeTimeout, setBarcodeTimeout] = useState(null);

  // Create ref for the barcode input to enable auto-focus
  const barcodeInputRef = useRef(null);

  // Redirect to POS if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/pos');
    }
  }, [user, router]);
  
  const [formData, setFormData] = useState({
    name: "",
    category: "", // Will be set from Redux categories when loaded
    price: "",
    stock: "",
    lowStockThreshold: "5",
    taxable: false,
    barcode: "",
    barcode2: "",
  });

  // Set default category when categories are loaded
  useEffect(() => {
    console.log("Categories loaded from Redux:", categories);
    if (categories.length > 0 && !formData.category) {
      console.log("Setting default category from Redux:", categories[0]);
      setFormData((prev) => ({ ...prev, category: categories[0] }));
    }
  }, [categories]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (barcodeTimeout) {
        clearTimeout(barcodeTimeout);
      }
    };
  }, [barcodeTimeout]);

  // Auto-focus on barcode input when component mounts and user is authenticated
  useEffect(() => {
    if (user && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Check for existing product when barcode field changes
    if (name === "barcode") {
      // Clear any existing timeout
      if (barcodeTimeout) {
        clearTimeout(barcodeTimeout);
      }

      if (value.trim()) {
        // Set a debounced timeout for API call
        const timeoutId = setTimeout(() => {
          checkExistingProductInDatabase(value.trim());
        }, 500); // 500ms delay for debouncing
        setBarcodeTimeout(timeoutId);
      } else {
        // Clear edit mode when barcode is cleared
        clearEditMode();
      }
    }
  };

  const checkExistingProductInDatabase = async (barcodeValue) => {
    setIsCheckingBarcode(true);
    setBarcodeCheckMessage("🔍 Checking database for existing product...");

    try {
      // Fetch all inventory from database to check for barcode/ID match
      const response = await fetch("/api/inventory");
      
      if (!response.ok) {
        throw new Error("Failed to fetch inventory");
      }

      const inventory = await response.json();
      const inventoryList = Array.isArray(inventory) ? inventory : [];

      // Check if barcode, barcode2, productId, or product ID exists
      let existingProduct = null;
      let matchedField = '';
      
      for (const item of inventoryList) {
        if (item.barcode === barcodeValue) {
          existingProduct = item;
          matchedField = 'primary barcode';
          break;
        } else if (item.barcode2 === barcodeValue) {
          existingProduct = item;
          matchedField = 'secondary barcode';
          break;
        } else if (item.productId === barcodeValue) {
          existingProduct = item;
          matchedField = 'product ID';
          break;
        } else if (item.id.toString() === barcodeValue) {
          existingProduct = item;
          matchedField = 'item ID';
          break;
        }
      }

      if (existingProduct) {
        // Product exists - load it for editing
        setIsEditMode(true);
        setExistingProductId(existingProduct.id);
        setBarcodeCheckMessage(`✅ Found existing product: "${existingProduct.name}" (matched ${matchedField}) - All fields auto-filled for editing`);
        
        // Auto-fill all fields with existing product data
        setFormData(prev => ({
          ...prev,
          name: existingProduct.name,
          category: existingProduct.category,
          price: existingProduct.price.toString(),
          stock: existingProduct.stock.toString(),
          lowStockThreshold: existingProduct.lowStockThreshold.toString(),
          taxable: existingProduct.taxable || false,
          barcode: existingProduct.barcode || barcodeValue,
          barcode2: existingProduct.barcode2 || "",
        }));
        
        // Store the existing productId for use during update
        setExistingProductData(existingProduct);
      } else {
        // Product doesn't exist - new product mode
        clearEditMode();
        setBarcodeCheckMessage("✨ New product - ready to add to inventory");
      }
    } catch (error) {
      console.error("Error checking barcode in database:", error);
      setBarcodeCheckMessage("❌ Error checking database. Please try again or contact support.");
      clearEditMode();
    } finally {
      setIsCheckingBarcode(false);
    }
  };

  const clearEditMode = () => {
    setIsEditMode(false);
    setExistingProductId(null);
    setExistingProductData(null);
    setBarcodeCheckMessage("");
    setIsCheckingBarcode(false);
    
    // Clear any pending barcode timeout
    if (barcodeTimeout) {
      clearTimeout(barcodeTimeout);
      setBarcodeTimeout(null);
    }
  };

  const handleClearForm = () => {
    const defaultCategory = categories.length > 0 ? categories[0].name : "Snacks";
    setFormData({
      name: "",
      category: defaultCategory,
      price: "",
      stock: "",
      lowStockThreshold: "5",
      taxable: false,
      barcode: "",
    });
    clearEditMode();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("Form submission started");
    console.log("Form data:", formData);
    console.log("Is edit mode:", isEditMode);
    console.log("Existing product ID:", existingProductId);

    // Validate form
    if (!formData.name || !formData.price || !formData.stock || !formData.category) {
      console.log("Form validation failed:", { 
        name: formData.name, 
        price: formData.price, 
        stock: formData.stock,
        category: formData.category
      });
      alert("Please fill in all required fields (name, price, stock, category)");
      return;
    }
    
    console.log("Form validation passed");

    try {
      // Fetch fresh inventory data for validation
      const res = await fetch("/api/inventory");
      if (!res.ok) {
        throw new Error("Failed to fetch inventory");
      }
      const existing = await res.json();
      const inventoryList = Array.isArray(existing) ? existing : [];

      if (isEditMode && existingProductId) {
        // Update existing product
        // Validate numeric fields before creating update object
        const priceValue = parseFloat(formData.price);
        const stockValue = parseInt(formData.stock);
        const thresholdValue = parseInt(formData.lowStockThreshold);
        
        if (isNaN(priceValue) || priceValue < 0) {
          throw new Error("Invalid price value");
        }
        if (isNaN(stockValue) || stockValue < 0) {
          throw new Error("Invalid stock value"); 
        }
        if (isNaN(thresholdValue) || thresholdValue < 0) {
          throw new Error("Invalid low stock threshold value");
        }

        const updatedItem = {
          id: existingProductId, // Keep the original ID
          name: formData.name.trim(),
          category: formData.category,
          price: priceValue,
          stock: stockValue,
          lowStockThreshold: thresholdValue,
          taxable: formData.taxable,
          barcode: formData.barcode.trim() || existingProductId.toString(),
          barcode2: formData.barcode2.trim() || undefined, // Only include if not empty
          productId: existingProductData?.productId || formData.barcode.trim() || existingProductId.toString(), // Preserve original productId
        };

        console.log("=== PRODUCT UPDATE DEBUG ===");
        console.log("Existing Product ID:", existingProductId);
        console.log("Existing Product Data:", existingProductData);
        console.log("Form Data:", formData);
        console.log("Updated Item to Send:", updatedItem);
        console.log("API URL:", `/api/inventory/${existingProductId}`);
        
        // Use the individual item API endpoint for updates instead of full inventory
        const updateResponse = await fetch(`/api/inventory/${existingProductId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "dev-secret",
          },
          body: JSON.stringify(updatedItem),
        });

        console.log("Update Response Status:", updateResponse.status);
        console.log("Update Response OK:", updateResponse.ok);
        
        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error("Update Error Response:", errorText);
          
          let errorDetails = errorText;
          try {
            const errorJson = JSON.parse(errorText);
            errorDetails = errorJson.details || errorJson.error || errorText;
          } catch (e) {
            // Keep original error text if not JSON
          }
          
          throw new Error(`Failed to update product: ${updateResponse.status} - ${errorDetails}`);
        }

        const updateResult = await updateResponse.json();
        console.log("Update response:", updateResult);
        console.log("=== UPDATE SUCCESSFUL ===");
        alert(`Product "${formData.name}" updated successfully!`);
      } else {
        // Create new product
        const productId = Date.now();
        const barcodeToUse = formData.barcode.trim() || productId.toString();

        // Double-check for duplicates before creating
        let duplicateProduct = null;
        let duplicateField = '';
        
        for (const item of inventoryList) {
          // Check primary barcode conflicts
          if (item.barcode === barcodeToUse) {
            duplicateProduct = item;
            duplicateField = `primary barcode "${barcodeToUse}"`;
            break;
          }
          if (item.barcode2 === barcodeToUse) {
            duplicateProduct = item;
            duplicateField = `secondary barcode "${barcodeToUse}"`;
            break;
          }
          if (item.productId === barcodeToUse) {
            duplicateProduct = item;
            duplicateField = `product ID "${barcodeToUse}"`;
            break;
          }
          if (item.id.toString() === barcodeToUse) {
            duplicateProduct = item;
            duplicateField = `item ID "${barcodeToUse}"`;
            break;
          }
          
          // Check secondary barcode conflicts if provided
          if (formData.barcode2 && formData.barcode2.trim()) {
            if (item.barcode === formData.barcode2) {
              duplicateProduct = item;
              duplicateField = `primary barcode "${formData.barcode2}" (your secondary barcode)`;
              break;
            }
            if (item.barcode2 === formData.barcode2) {
              duplicateProduct = item;
              duplicateField = `secondary barcode "${formData.barcode2}"`;
              break;
            }
            if (item.productId === formData.barcode2) {
              duplicateProduct = item;
              duplicateField = `product ID "${formData.barcode2}" (your secondary barcode)`;
              break;
            }
          }
        }

        if (duplicateProduct) {
          alert(`Cannot create product: ${duplicateField} already exists in product "${duplicateProduct.name}". Please use a different barcode or edit the existing product.`);
          return;
        }

        const newItem = {
          id: productId,
          name: formData.name,
          category: formData.category,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          lowStockThreshold: parseInt(formData.lowStockThreshold),
          taxable: formData.taxable,
          barcode: barcodeToUse,
          barcode2: formData.barcode2.trim() || undefined, // Only include if not empty
          productId: barcodeToUse, // Use the barcode as productId to ensure uniqueness
        };

        console.log("Adding new product:", newItem);
        
        // Send only the new item instead of the entire inventory array
        const addResponse = await fetch("/api/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "dev-secret",
          },
          body: JSON.stringify([newItem]), // Send as array with single item
        });

        if (!addResponse.ok) {
          const errorText = await addResponse.text();
          throw new Error(`Failed to add product: ${addResponse.status} - ${errorText}`);
        }

        const addResult = await addResponse.json();
        console.log("Add response:", addResult);
        alert(`Product "${formData.name}" added successfully!`);
      }

      router.push("/inventory");
      return;
    } catch (err) {
      console.error("Failed to save item - Full error details:", err);
      alert(`Failed to save item: ${err.message || err}`);
    }
  };

  const handleCancel = () => {
    router.push("/inventory");
  };

  return (
    <Container>
      <Title>{isEditMode ? "Edit Product" : "Add New Item"}</Title>
      
      {(barcodeCheckMessage || isCheckingBarcode) && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          borderRadius: '8px',
          backgroundColor: isCheckingBarcode ? '#fff3cd' : (isEditMode ? '#e8f5e8' : '#f0f8ff'),
          border: `2px solid ${isCheckingBarcode ? '#ffc107' : (isEditMode ? '#4caf50' : '#2196f3')}`,
          color: isCheckingBarcode ? '#856404' : (isEditMode ? '#2e7d32' : '#1976d2'),
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {isCheckingBarcode && (
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid #856404',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          )}
          {barcodeCheckMessage || (isCheckingBarcode ? "Checking database..." : "")}
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <FormContainer>
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <label htmlFor="name">Product Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter product name"
              required
            />
          </FormGroup>

          <FormGroup>
            <label htmlFor="barcode">Product ID / Barcode</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                id="barcode"
                name="barcode"
                ref={barcodeInputRef}
                value={formData.barcode}
                onChange={handleChange}
                placeholder="Auto-generated or enter custom barcode"
                disabled={isCheckingBarcode}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.95rem',
                  width: '100%',
                  paddingRight: isCheckingBarcode ? '40px' : '12px',
                  backgroundColor: isCheckingBarcode ? '#f8f9fa' : 'white',
                  opacity: isCheckingBarcode ? 0.7 : 1
                }}
              />
              {isCheckingBarcode && (
                <div style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  border: '2px solid #007bff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              )}
            </div>
            <small style={{ 
              color: '#7f8c8d', 
              fontSize: '0.8rem', 
              marginTop: '0.25rem', 
              display: 'block' 
            }}>
              Enter barcode/ID to search database for existing products. Real-time lookup will auto-fill fields if found.
            </small>
          </FormGroup>

          <FormGroup>
            <label htmlFor="barcode2">Secondary Barcode (Optional)</label>
            <input
              type="text"
              id="barcode2"
              name="barcode2"
              value={formData.barcode2}
              onChange={handleChange}
              placeholder="Enter alternative barcode/identifier"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.95rem',
              }}
            />
            <small style={{ 
              color: '#7f8c8d', 
              fontSize: '0.8rem', 
              marginTop: '0.25rem', 
              display: 'block' 
            }}>
              Optional secondary barcode for products with multiple identifiers.
            </small>
          </FormGroup>

          <FormGroup>
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              {categories.map((category) => (
                <option
                  key={category.name || category}
                  value={category.name || category}
                >
                  {category.name || category}
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup>
            <label htmlFor="price">Price ($) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </FormGroup>

          <FormGroup>
            <label htmlFor="stock">Initial Stock *</label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              placeholder="0"
              min="0"
              required
            />
          </FormGroup>

          <FormGroup>
            <label htmlFor="lowStockThreshold">Low Stock Threshold</label>
            <input
              type="number"
              id="lowStockThreshold"
              name="lowStockThreshold"
              value={formData.lowStockThreshold}
              onChange={handleChange}
              placeholder="5"
              min="0"
            />
          </FormGroup>

          <FormGroup>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                name="taxable"
                checked={formData.taxable}
                onChange={handleChange}
                style={{ width: "18px", height: "18px" }}
              />
              <span>Subject to HST (13%)</span>
            </label>
          </FormGroup>

          <ButtonContainer>
            <CancelButton type="button" onClick={handleCancel}>
              Cancel
            </CancelButton>
            {isEditMode && (
              <CancelButton type="button" onClick={handleClearForm} style={{ backgroundColor: '#f39c12' }}>
                Clear Form
              </CancelButton>
            )}
            <SubmitButton type="submit">
              {isEditMode ? "Update Product" : "Add Item"}
            </SubmitButton>
          </ButtonContainer>
        </form>
      </FormContainer>
    </Container>
  );
}
