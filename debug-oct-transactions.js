const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function checkOctoberTransactionTypes() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Get October alcohol transactions and check their transactionType values
    const query = {
      timestamp: {
        $gte: new Date("2025-10-01T00:00:00.000Z"),
        $lt: new Date("2025-11-01T00:00:00.000Z"),
      },
      "items.category": "Alcohol",
    };

    const transactions = await collection.find(query).toArray();
    console.log(`Found ${transactions.length} October alcohol transactions`);

    // Analyze transactionType distribution
    const typeStats = {};
    const missingType = [];

    transactions.forEach((t, index) => {
      if (t.transactionType) {
        typeStats[t.transactionType] = (typeStats[t.transactionType] || 0) + 1;
      } else {
        missingType.push(index + 1);
      }
    });

    console.log("\nTransactionType distribution:");
    Object.entries(typeStats).forEach(([type, count]) => {
      console.log(`${type}: ${count} transactions`);
    });

    if (missingType.length > 0) {
      console.log(
        `\n⚠️  ${missingType.length} transactions missing transactionType field`
      );
      console.log("First few missing:", missingType.slice(0, 10));
    }

    // Show sample of first few transactions
    console.log("\nFirst 5 October transactions:");
    transactions.slice(0, 5).forEach((t, i) => {
      console.log(
        `${i + 1}. ${t.transactionId} | $${t.total} | transactionType: ${
          t.transactionType || "MISSING"
        } | paymentMethod: ${t.paymentMethod}`
      );
    });

    // Check if filtered by "cash" would give 18 transactions
    const cashTransactions = transactions.filter(
      (t) => t.transactionType === "cash"
    );
    console.log(
      `\nIf filtered by "cash": ${cashTransactions.length} transactions`
    );

    if (cashTransactions.length <= 20) {
      let cashTotal = 0;
      cashTransactions.forEach((t) => (cashTotal += t.total));
      console.log(`Cash transactions total: $${cashTotal.toFixed(2)}`);

      if (Math.abs(cashTotal - 923.78) < 50) {
        console.log("🎯 This might explain the $923.78 you're seeing!");
      }
    }

    // Check other possible filters
    const cardTransactions = transactions.filter(
      (t) => t.transactionType === "card"
    );
    console.log(
      `If filtered by "card": ${cardTransactions.length} transactions`
    );
  } catch (error) {
    console.error("Error checking October transaction types:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

// Run the check script
checkOctoberTransactionTypes();
