"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Container,
  Title,
  Table,
  Button,
  FilterContainer,
  Select,
} from "../styles/inventoryStyles";
import { Card, CardGrid } from "../styles/homeStyles";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [dateFilter, setDateFilter] = useState("all");
  const [expandedTransaction, setExpandedTransaction] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/transaction");
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setTransactions(list.reverse());
        setFilteredTransactions(list.reverse());
      } catch (err) {
        console.error("Failed to load transactions from server", err);
        const savedTransactions = JSON.parse(
          localStorage.getItem("transactions") || "[]"
        );
        setTransactions(savedTransactions.reverse());
        setFilteredTransactions(savedTransactions.reverse());
      }
    };
    load();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [dateFilter, transactions]);

  const filterTransactions = () => {
    let filtered = [...transactions];

    if (dateFilter === "today") {
      const today = new Date().toDateString();
      filtered = transactions.filter(
        (t) => new Date(t.timestamp).toDateString() === today
      );
    } else if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = transactions.filter((t) => new Date(t.timestamp) >= weekAgo);
    } else if (dateFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = transactions.filter((t) => new Date(t.timestamp) >= monthAgo);
    }

    setFilteredTransactions(filtered);
  };

  const getTotalSales = () => {
    return filteredTransactions.reduce(
      (sum, transaction) => sum + transaction.total,
      0
    );
  };

  const getTotalTransactions = () => {
    return filteredTransactions.length;
  };

  const getAverageTransaction = () => {
    if (filteredTransactions.length === 0) return 0;
    return getTotalSales() / getTotalTransactions();
  };

  const toggleTransactionDetails = (transactionId) => {
    setExpandedTransaction(
      expandedTransaction === transactionId ? null : transactionId
    );
  };

  const clearAllTransactions = () => {
    if (
      confirm(
        "Are you sure you want to clear all transaction history? This cannot be undone."
      )
    ) {
      fetch("/api/transaction", {
        method: "DELETE",
        headers: { "x-api-key": "dev-secret" },
      })
        .then((res) => res.json())
        .then(() => {
          setTransactions([]);
          setFilteredTransactions([]);
        })
        .catch((err) => {
          console.error("Failed to clear transactions on server", err);
          alert("Failed to clear transactions on server");
        });
    }
  };

  return (
    <Container>
      <Title>Sales Transactions</Title>

      <CardGrid style={{ marginBottom: "2rem" }}>
        <Card>
          <h3>Total Sales</h3>
          <p
            style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#27ae60" }}
          >
            ${getTotalSales().toFixed(2)}
          </p>
          <p>For selected period</p>
        </Card>

        <Card>
          <h3>Total Transactions</h3>
          <p
            style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#3498db" }}
          >
            {getTotalTransactions()}
          </p>
          <p>Number of sales</p>
        </Card>

        <Card>
          <h3>Average Sale</h3>
          <p
            style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#f39c12" }}
          >
            ${getAverageTransaction().toFixed(2)}
          </p>
          <p>Per transaction</p>
        </Card>
      </CardGrid>

      <FilterContainer>
        <Select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </Select>

        <Link href="/pos">
          <Button>New Sale</Button>
        </Link>

        {transactions.length > 0 && (
          <Button
            onClick={clearAllTransactions}
            style={{ background: "#e74c3c" }}
          >
            Clear History
          </Button>
        )}
      </FilterContainer>

      {filteredTransactions.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            background: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3 style={{ color: "#7f8c8d", marginBottom: "1rem" }}>
            No transactions found
          </h3>
          <p style={{ color: "#7f8c8d" }}>
            {dateFilter === "all"
              ? "Start making sales to see transaction history here."
              : "No transactions found for the selected time period."}
          </p>
        </div>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Date & Time</th>
              <th>Items</th>
              <th>Subtotal</th>
              <th>HST</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => (
              <>
                <tr key={transaction.id}>
                  <td>#{transaction.id}</td>
                  <td>{new Date(transaction.timestamp).toLocaleString()}</td>
                  <td>
                    {transaction.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    )}{" "}
                    items
                  </td>
                  <td>${transaction.subtotal.toFixed(2)}</td>
                  <td>
                    {transaction.includeTax !== false
                      ? `$${transaction.tax.toFixed(2)}`
                      : "N/A"}
                  </td>
                  <td style={{ fontWeight: "bold", color: "#27ae60" }}>
                    ${transaction.total.toFixed(2)}
                  </td>
                  <td>
                    <Button
                      onClick={() => toggleTransactionDetails(transaction.id)}
                      style={{
                        padding: "0.5rem 1rem",
                        fontSize: "0.9rem",
                        background:
                          expandedTransaction === transaction.id
                            ? "#e74c3c"
                            : "#3498db",
                      }}
                    >
                      {expandedTransaction === transaction.id
                        ? "Hide"
                        : "Details"}
                    </Button>
                  </td>
                </tr>
                {expandedTransaction === transaction.id && (
                  <tr>
                    <td
                      colSpan="7"
                      style={{ backgroundColor: "#f8f9fa", padding: "1rem" }}
                    >
                      <h4 style={{ marginBottom: "1rem", color: "#2c3e50" }}>
                        Transaction Details
                      </h4>
                      <div style={{ display: "grid", gap: "0.5rem" }}>
                        {transaction.items.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "0.5rem",
                              background: "white",
                              borderRadius: "4px",
                            }}
                          >
                            <span>{item.name}</span>
                            <span>
                              {item.quantity} × ${item.price.toFixed(2)} = $
                              {(item.quantity * item.price).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}
