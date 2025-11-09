"use client";

import { useState, useEffect } from "react";
import { Container, Title, Card, CardGrid } from "../styles/homeStyles";
import { Table } from "../styles/inventoryStyles";

export default function ReportsPage() {
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
  });
  const [salesStats, setSalesStats] = useState({
    totalSales: 0,
    totalTransactions: 0,
    todaySales: 0,
    topSellingItem: null,
    totalTaxCollected: 0,
  });

  useEffect(() => {
    const load = async () => {
      let savedInventory = [];
      let savedTransactions = [];
      try {
        const [invRes, txRes] = await Promise.all([
          fetch("/api/inventory"),
          fetch("/api/transaction"),
        ]);
        const [invData, txData] = await Promise.all([
          invRes.json(),
          txRes.json(),
        ]);
        savedInventory = Array.isArray(invData) ? invData : [];
        savedTransactions = Array.isArray(txData) ? txData : [];
      } catch (err) {
        console.error(
          "Failed to load reports data from server, falling back to localStorage",
          err
        );
        savedInventory = JSON.parse(localStorage.getItem("inventory") || "[]");
        savedTransactions = JSON.parse(
          localStorage.getItem("transactions") || "[]"
        );
      }

      setInventory(savedInventory);
      setTransactions(savedTransactions);

      const totalItems = savedInventory.length;
      const totalValue = savedInventory.reduce(
        (sum, item) => sum + item.price * item.stock,
        0
      );
      const lowStockItems = savedInventory.filter(
        (item) => item.stock <= item.lowStockThreshold && item.stock > 0
      ).length;
      const outOfStockItems = savedInventory.filter(
        (item) => item.stock === 0
      ).length;

      setStats({
        totalItems,
        totalValue,
        lowStockItems,
        outOfStockItems,
      });

      // Calculate sales statistics
      const totalSales = savedTransactions.reduce(
        (sum, transaction) => sum + (transaction.total || 0),
        0
      );
      const totalTransactions = savedTransactions.length;
      const totalTaxCollected = savedTransactions.reduce(
        (sum, transaction) => sum + (transaction.tax || 0),
        0
      );

      const today = new Date().toDateString();
      const todaySales = savedTransactions
        .filter((t) => new Date(t.timestamp).toDateString() === today)
        .reduce((sum, transaction) => sum + (transaction.total || 0), 0);

      // Find top selling item
      const itemSales = {};
      savedTransactions.forEach((transaction) => {
        (transaction.items || []).forEach((item) => {
          if (!item) return;
          itemSales[item.name] =
            (itemSales[item.name] || 0) + (item.quantity || 0);
        });
      });

      const topSellingItem =
        Object.keys(itemSales).length > 0
          ? Object.keys(itemSales).reduce((a, b) =>
              itemSales[a] > itemSales[b] ? a : b
            )
          : null;

      setSalesStats({
        totalSales,
        totalTransactions,
        todaySales,
        topSellingItem,
        totalTaxCollected,
      });
    };

    load();
  }, []);

  const categoryStats = inventory.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { count: 0, value: 0 };
    }
    acc[item.category].count += 1;
    acc[item.category].value += item.price * item.stock;
    return acc;
  }, {});

  return (
    <Container>
      <Title>Inventory Reports</Title>

      <div style={{ marginBottom: "3rem" }}>
        <h2 style={{ marginBottom: "1rem", color: "#2c3e50" }}>
          Sales Overview
        </h2>
        <CardGrid>
          <Card>
            <h3>Total Sales</h3>
            <p
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#27ae60" }}
            >
              ${salesStats.totalSales.toFixed(2)}
            </p>
            <p>All time revenue</p>
          </Card>

          <Card>
            <h3>Today's Sales</h3>
            <p
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#3498db" }}
            >
              ${salesStats.todaySales.toFixed(2)}
            </p>
            <p>Revenue today</p>
          </Card>

          <Card>
            <h3>Transactions</h3>
            <p
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#9b59b6" }}
            >
              {salesStats.totalTransactions}
            </p>
            <p>Total completed sales</p>
          </Card>

          <Card>
            <h3>Top Selling Item</h3>
            <p
              style={{
                fontSize: "1.2rem",
                fontWeight: "bold",
                color: "#e67e22",
              }}
            >
              {salesStats.topSellingItem || "N/A"}
            </p>
            <p>Most sold product</p>
          </Card>
        </CardGrid>
      </div>

      <div style={{ marginBottom: "3rem" }}>
        <h2 style={{ marginBottom: "1rem", color: "#2c3e50" }}>
          Inventory Overview
        </h2>
        <CardGrid>
          <Card>
            <h3>Total Items</h3>
            <p
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#3498db" }}
            >
              {stats.totalItems}
            </p>
            <p>Different products in inventory</p>
          </Card>

          <Card>
            <h3>Inventory Value</h3>
            <p
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#27ae60" }}
            >
              ${stats.totalValue.toFixed(2)}
            </p>
            <p>Current inventory value</p>
          </Card>

          <Card>
            <h3>Low Stock Alerts</h3>
            <p
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#f39c12" }}
            >
              {stats.lowStockItems}
            </p>
            <p>Items running low on stock</p>
          </Card>

          <Card>
            <h3>Out of Stock</h3>
            <p
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#e74c3c" }}
            >
              {stats.outOfStockItems}
            </p>
            <p>Items completely out of stock</p>
          </Card>
        </CardGrid>
      </div>

      <div style={{ marginTop: "3rem" }}>
        <h2 style={{ marginBottom: "1rem", color: "#2c3e50" }}>
          Category Breakdown
        </h2>
        <Table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Items Count</th>
              <th>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(categoryStats).map(([category, data]) => (
              <tr key={category}>
                <td>{category}</td>
                <td>{data.count}</td>
                <td>${data.value.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <div style={{ marginTop: "3rem" }}>
        <h2 style={{ marginBottom: "1rem", color: "#2c3e50" }}>
          All Items Summary
        </h2>
        <Table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Unit Price</th>
              <th>Total Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>{item.stock}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>${(item.price * item.stock).toFixed(2)}</td>
                <td>
                  {item.stock === 0 ? (
                    <span style={{ color: "#e74c3c" }}>Out of Stock</span>
                  ) : item.stock <= item.lowStockThreshold ? (
                    <span style={{ color: "#f39c12" }}>Low Stock</span>
                  ) : (
                    <span style={{ color: "#27ae60" }}>In Stock</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Container>
  );
}
