const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

// Payment methods with realistic distribution for alcohol sales
const paymentMethods = [
  { method: "card", weight: 40 }, // Most common
  { method: "credit", weight: 30 }, // Credit cards popular for higher-value purchases
  { method: "cash", weight: 20 }, // Some cash transactions
  { method: "mixed", weight: 10 }, // Mixed payments for larger purchases
];

function getWeightedPaymentMethod() {
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const pm of paymentMethods) {
    cumulative += pm.weight;
    if (random <= cumulative) {
      return pm.method;
    }
  }
  return "card"; // fallback
}

async function updateOctoberAlcoholPaymentMethods() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Find October 2025 alcohol transactions that need payment method updates
    const query = {
      timestamp: {
        $gte: new Date("2025-10-01T00:00:00.000Z"),
        $lt: new Date("2025-11-01T00:00:00.000Z"),
      },
      "items.category": "Alcohol",
      $or: [
        { paymentMethod: { $exists: false } },
        { paymentMethod: null },
        { paymentMethod: "" },
        { paymentMethod: "unknown" },
      ],
    };

    const transactionsToUpdate = await collection.find(query).toArray();
    console.log(
      `Found ${transactionsToUpdate.length} October alcohol transactions that need payment method updates`
    );

    if (transactionsToUpdate.length === 0) {
      console.log(
        "All October alcohol transactions already have payment methods assigned"
      );
      return;
    }

    let updateCount = 0;
    const paymentMethodStats = {};

    // Update each transaction with a random payment method
    for (const transaction of transactionsToUpdate) {
      const paymentMethod = getWeightedPaymentMethod();

      await collection.updateOne(
        { _id: transaction._id },
        { $set: { paymentMethod: paymentMethod } }
      );

      updateCount++;
      paymentMethodStats[paymentMethod] =
        (paymentMethodStats[paymentMethod] || 0) + 1;
    }

    console.log(
      `✅ Successfully updated ${updateCount} transactions with payment methods`
    );
    console.log("\n💳 Payment method distribution:");
    Object.entries(paymentMethodStats).forEach(([method, count]) => {
      const percentage = ((count / updateCount) * 100).toFixed(1);
      console.log(`${method}: ${count} transactions (${percentage}%)`);
    });

    // Verify the updates
    const updatedQuery = {
      timestamp: {
        $gte: new Date("2025-10-01T00:00:00.000Z"),
        $lt: new Date("2025-11-01T00:00:00.000Z"),
      },
      "items.category": "Alcohol",
      paymentMethod: { $exists: true, $ne: null, $ne: "" },
    };

    const verificationCount = await collection.countDocuments(updatedQuery);
    console.log(
      `\n✅ Verification: ${verificationCount} October alcohol transactions now have payment methods`
    );
  } catch (error) {
    console.error("Error updating October alcohol payment methods:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

// Run the update script
updateOctoberAlcoholPaymentMethods();
