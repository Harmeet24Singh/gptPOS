const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function checkPaymentStructure() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Get a few October transactions to examine structure
    const sampleTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-10-01T00:00:00.000Z"),
          $lt: new Date("2025-11-01T00:00:00.000Z"),
        },
      })
      .limit(5)
      .toArray();

    console.log(
      `\n📋 Found ${sampleTransactions.length} sample transactions\n`
    );

    sampleTransactions.forEach((transaction, index) => {
      console.log(`=== Transaction ${index + 1} ===`);
      console.log(`ID: ${transaction.transactionId}`);
      console.log(`Total: $${transaction.total}`);

      // Check payment method field
      if (transaction.paymentMethod) {
        console.log(`Payment Method: ${transaction.paymentMethod}`);
      } else {
        console.log(`Payment Method: NOT FOUND`);
      }

      // Check paymentBreakdown array
      if (
        transaction.paymentBreakdown &&
        Array.isArray(transaction.paymentBreakdown)
      ) {
        console.log(
          `Payment Breakdown (${transaction.paymentBreakdown.length} entries):`
        );
        transaction.paymentBreakdown.forEach((payment, idx) => {
          console.log(
            `  ${idx}: method="${payment.method}", amount=${payment.amount}`
          );
        });
      } else {
        console.log(`Payment Breakdown: NOT FOUND or not an array`);
      }

      // Show all payment-related fields
      console.log(`All payment fields in transaction:`);
      Object.keys(transaction).forEach((key) => {
        if (
          key.toLowerCase().includes("payment") ||
          key.toLowerCase().includes("cash") ||
          key.toLowerCase().includes("card")
        ) {
          console.log(`  ${key}: ${JSON.stringify(transaction[key])}`);
        }
      });

      console.log(
        `Items count: ${transaction.items ? transaction.items.length : 0}`
      );
      if (transaction.items && transaction.items.length > 0) {
        console.log(`First item category: ${transaction.items[0].category}`);
      }
      console.log("");
    });
  } catch (error) {
    console.error("Error checking payment structure:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

checkPaymentStructure();
