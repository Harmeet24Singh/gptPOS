"use client";
import React, { useState } from "react";

export default function Page() {
  const [status, setStatus] = useState("Idle");
  const [busy, setBusy] = useState(false);

  const handleImport = async () => {
    setBusy(true);
    setStatus("Reading localStorage...");
    try {
      const inventory = JSON.parse(localStorage.getItem("inventory") || "[]");
      const transactions = JSON.parse(
        localStorage.getItem("transactions") || "[]"
      );

      setStatus(
        `Found inventory: ${inventory.length}, transactions: ${transactions.length}. Uploading...`
      );

      const res = await fetch("/api/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "dev-secret",
        },
        body: JSON.stringify({ inventory, transactions }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus(
          `Import complete — inventory: ${data.imported.inventory}, transactions: ${data.imported.transactions}`
        );
      } else {
        setStatus("Import failed: " + (data.error || JSON.stringify(data)));
      }
    } catch (err) {
      setStatus("Import error: " + String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Migration helper</h1>
      <p>
        This tool will import <code>inventory</code> and{" "}
        <code>transactions</code> from your browser's localStorage into the
        server SQLite database.
      </p>
      <p>
        It is safe for first-run seeding. Transactions are saved without
        modifying stock so they won't double-deduct inventory.
      </p>
      <div style={{ marginTop: 12 }}>
        <button
          onClick={handleImport}
          disabled={busy}
          style={{ padding: "8px 12px" }}
        >
          {busy ? "Importing..." : "Import from localStorage"}
        </button>
      </div>
      <div style={{ marginTop: 12 }}>
        <strong>Status:</strong> {status}
      </div>
    </div>
  );
}
