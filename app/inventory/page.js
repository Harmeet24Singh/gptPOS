"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

// Mock data - In a real app, this would come from an API
const initialInventory = [
  {
    id: 1,
    name: "Coca Cola 355ml",
    category: "Beverages",
    price: 1.5,
    stock: 24,
    lowStockThreshold: 10,
    taxable: true,
  },
  {
    id: 2,
    name: "Lays Classic Chips",
    category: "Snacks",
    price: 2.99,
    stock: 8,
    lowStockThreshold: 15,
    taxable: true,
  },
  {
    id: 3,
    name: "Wonder Bread",
    category: "Bakery",
    price: 3.49,
    stock: 12,
    lowStockThreshold: 5,
    taxable: false,
  },
  {
    id: 4,
    name: "Marlboro Gold",
    category: "Tobacco",
    price: 12.99,
    stock: 3,
    lowStockThreshold: 5,
    taxable: true,
  },
  {
    id: 5,
    name: "Red Bull 250ml",
    category: "Beverages",
    price: 3.99,
    stock: 18,
    lowStockThreshold: 8,
    taxable: true,
  },
];

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    // Load inventory from server
    const load = async () => {
      try {
        const res = await fetch("/api/inventory");
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          // seed initial inventory
          await fetch("/api/inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(initialInventory),
          });
          const r2 = await fetch("/api/inventory");
          const d2 = await r2.json();
          setInventory(d2);
        } else {
          setInventory(data);
        }
      } catch (err) {
        console.error("Failed to load inventory from server", err);
        setInventory(initialInventory);
      }
    };
    load();
  }, []);

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(inventory.map((item) => item.category))];

  const updateStock = (id, newStock) => {
    const updatedInventory = inventory.map((item) =>
      item.id === id ? { ...item, stock: Math.max(0, newStock) } : item
    );
    // persist to server
    fetch("/api/inventory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "dev-secret",
      },
      body: JSON.stringify(updatedInventory),
    })
      .then((res) => res.json())
      .then(() => setInventory(updatedInventory))
      .catch((err) => {
        console.error("Failed to update stock on server", err);
        alert("Failed to update stock on server");
      });
  };

  const deleteItem = (id) => {
    if (confirm("Are you sure you want to delete this item?")) {
      const updatedInventory = inventory.filter((item) => item.id !== id);
      // persist to server
      fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "dev-secret",
        },
        body: JSON.stringify(updatedInventory),
      })
        .then((res) => res.json())
        .then(() => setInventory(updatedInventory))
        .catch((err) => {
          console.error("Failed to delete item on server", err);
          alert("Failed to delete item on server");
        });
    }
  };

  return (
    <Container>
      <Title>Inventory Management</Title>

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
      </FilterContainer>

      <Table>
        <thead>
          <tr>
            <th>Name</th>
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
              <td>{item.category}</td>
              <td>${item.price.toFixed(2)}</td>
              <td>{item.stock}</td>
              <td>
                <Badge $isLow={item.stock <= item.lowStockThreshold}>
                  {item.stock <= item.lowStockThreshold
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
                  <button onClick={() => updateStock(item.id, item.stock + 1)}>
                    +1
                  </button>
                  <button onClick={() => updateStock(item.id, item.stock - 1)}>
                    -1
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
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
