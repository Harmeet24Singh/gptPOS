"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Container,
  Title,
  Table,
  Button,
  Badge,
  ActionButtons,
} from "../../styles/inventoryStyles";

export default function LowStockPage() {
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/inventory");
        const data = await res.json();
        const lowStock = data.filter(
          (item) => item.stock <= item.lowStockThreshold
        );
        setLowStockItems(lowStock);
      } catch (err) {
        console.error("Failed to load inventory for low-stock page", err);
        const savedInventory = JSON.parse(
          localStorage.getItem("inventory") || "[]"
        );
        const lowStock = savedInventory.filter(
          (item) => item.stock <= item.lowStockThreshold
        );
        setLowStockItems(lowStock);
      }
    };
    load();
  }, []);

  const updateStock = (id, newStock) => {
    const apply = async () => {
      try {
        const res = await fetch("/api/inventory");
        const existing = await res.json();
        const updatedInventory = existing.map((item) =>
          item.id === id ? { ...item, stock: Math.max(0, newStock) } : item
        );
        await fetch("/api/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "dev-secret",
          },
          body: JSON.stringify(updatedInventory),
        });
        const lowStock = updatedInventory.filter(
          (item) => item.stock <= item.lowStockThreshold
        );
        setLowStockItems(lowStock);
      } catch (err) {
        console.error("Failed to update stock on server", err);
        alert("Failed to update stock on server");
      }
    };
    apply();
  };

  return (
    <Container>
      <Title>Low Stock Items</Title>

      <div style={{ marginBottom: "2rem" }}>
        <Link href="/inventory">
          <Button>Back to Inventory</Button>
        </Link>
      </div>

      {lowStockItems.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            background: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3 style={{ color: "#27ae60", marginBottom: "1rem" }}>
            Great! No items are low on stock.
          </h3>
          <p style={{ color: "#7f8c8d" }}>
            All items are above their low stock thresholds.
          </p>
        </div>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Threshold</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {lowStockItems.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>{item.stock}</td>
                <td>{item.lowStockThreshold}</td>
                <td>
                  <Badge $isLow={true}>
                    {item.stock === 0 ? "Out of Stock" : "Low Stock"}
                  </Badge>
                </td>
                <td>
                  <ActionButtons>
                    <button
                      onClick={() => updateStock(item.id, item.stock + 5)}
                    >
                      +5
                    </button>
                    <button
                      onClick={() => updateStock(item.id, item.stock + 10)}
                    >
                      +10
                    </button>
                    <button
                      onClick={() => {
                        const amount = prompt("Enter restock amount:");
                        if (amount && !isNaN(amount)) {
                          updateStock(item.id, item.stock + parseInt(amount));
                        }
                      }}
                      style={{ background: "#27ae60" }}
                    >
                      Restock
                    </button>
                  </ActionButtons>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}
