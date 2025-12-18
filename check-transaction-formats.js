const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function checkExistingTransactionFormat() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Get a recent transaction (December) to see the correct format
    const recentTransaction = await collection.findOne({
      timestamp: {
        $gte: new Date("2025-12-01T00:00:00.000Z"),
      },
    });

    console.log("Recent transaction structure (December):");
    console.log(JSON.stringify(recentTransaction, null, 2));

    // Get an October alcohol transaction to see current wrong format
    const octoberTransaction = await collection.findOne({
      timestamp: {
        $gte: new Date("2025-10-01T00:00:00.000Z"),
        $lt: new Date("2025-11-01T00:00:00.000Z"),
      },
      "items.category": "Alcohol",
    });

    console.log(
      "\nOctober alcohol transaction structure (current wrong format):"
    );
    console.log(JSON.stringify(octoberTransaction, null, 2));
  } catch (error) {
    console.error("Error checking transaction format:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

// Run the check script
checkExistingTransactionFormat();
