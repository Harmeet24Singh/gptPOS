"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    lowStockThreshold: "5",
    taxable: true,
  });

  useEffect(() => {
    // Load categories from localStorage
    const savedCategories = localStorage.getItem("categories");
    if (savedCategories) {
      const categoryList = JSON.parse(savedCategories);
      setCategories(categoryList);
      // Set first category as default if available
      if (categoryList.length > 0 && !formData.category) {
        setFormData((prev) => ({ ...prev, category: categoryList[0].name }));
      }
    } else {
      // Fallback categories if none exist
      const defaultCategories = [
        "Beverages",
        "Snacks",
        "Bakery",
        "Tobacco",
        "Other",
      ];
      setCategories(defaultCategories.map((name) => ({ name })));
      setFormData((prev) => ({ ...prev, category: "Snacks" }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.name || !formData.price || !formData.stock) {
      alert("Please fill in all required fields");
      return;
    }

    const newItem = {
      id: Date.now(),
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      lowStockThreshold: parseInt(formData.lowStockThreshold),
      taxable: formData.taxable,
    };

    try {
      const res = await fetch("/api/inventory");
      const existing = await res.json();
      const updated = Array.isArray(existing)
        ? [...existing, newItem]
        : [newItem];
      await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "dev-secret",
        },
        body: JSON.stringify(updated),
      });
      router.push("/inventory");
      return;
    } catch (err) {
      console.error("Failed to add item", err);
      alert("Failed to add item");
    }
  };

  const handleCancel = () => {
    router.push("/inventory");
  };

  return (
    <Container>
      <Title>Add New Item</Title>

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
            <SubmitButton type="submit">Add Item</SubmitButton>
          </ButtonContainer>
        </form>
      </FormContainer>
    </Container>
  );
}
