const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function checkTransactionOrder() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Get July transactions ordered by transactionId to see the pattern
    const julyTransactions = await collection.find({
      timestamp: {
        $gte: new Date("2025-07-01T00:00:00.000Z"),
        $lt: new Date("2025-08-01T00:00:00.000Z"),
      }
    }).sort({ transactionId: 1 }).limit(50).toArray();

    console.log(`\n📋 First 50 July transactions payment method order:`);
    console.log(`Transaction ID | Payment Method | Total`);
    console.log(`-------------- | -------------- | -----`);
    
    julyTransactions.forEach((t, idx) => {
      console.log(`${t.transactionId.toString().padEnd(13)} | ${t.paymentMethod.padEnd(13)} | $${t.total.toFixed(2)}`);
    });

    // Show distribution in first 50 vs last 50
    const firstPaymentMethods = julyTransactions.reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + 1;
      return acc;
    }, {});

    console.log(`\n📊 Payment method distribution in first 50 transactions:`);
    Object.entries(firstPaymentMethods).forEach(([method, count]) => {
      console.log(`${method}: ${count} transactions (${(count/50*100).toFixed(1)}%)`);
    });

    // Check last 50 transactions
    const lastTransactions = await collection.find({
      timestamp: {
        $gte: new Date("2025-07-01T00:00:00.000Z"),
        $lt: new Date("2025-08-01T00:00:00.000Z"),
      }
    }).sort({ transactionId: -1 }).limit(50).toArray();

    const lastPaymentMethods = lastTransactions.reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + 1;
      return acc;
    }, {});

    console.log(`\n📊 Payment method distribution in last 50 transactions:`);
    Object.entries(lastPaymentMethods).forEach(([method, count]) => {
      console.log(`${method}: ${count} transactions (${(count/50*100).toFixed(1)}%)`);
    });

  } catch (error) {
    console.error("Error checking transaction order:", error);
  } finally {
    await client.close();
    console.log("\nConnection closed");
  }
}

checkTransactionOrder();