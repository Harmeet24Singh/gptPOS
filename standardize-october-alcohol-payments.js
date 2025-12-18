const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function standardizeOctoberAlcoholPaymentMethods() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Update debit to card to match system standard
    const debitUpdate = await collection.updateMany(
      {
        timestamp: {
          $gte: new Date("2025-10-01T00:00:00.000Z"),
          $lt: new Date("2025-11-01T00:00:00.000Z"),
        },
        "items.category": "Alcohol",
        paymentMethod: "debit",
      },
      { $set: { paymentMethod: "card" } }
    );

    console.log(
      `✅ Updated ${debitUpdate.modifiedCount} transactions from 'debit' to 'card'`
    );

    // Now add some 'mixed' payment method transactions
    // Convert 20% of cash transactions to mixed (for larger purchases)
    const cashTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-10-01T00:00:00.000Z"),
          $lt: new Date("2025-11-01T00:00:00.000Z"),
        },
        "items.category": "Alcohol",
        paymentMethod: "cash",
        total: { $gte: 35 }, // Only larger purchases become mixed payments
      })
      .limit(15)
      .toArray(); // Convert about 15 transactions to mixed

    let mixedCount = 0;
    for (const transaction of cashTransactions) {
      await collection.updateOne(
        { _id: transaction._id },
        { $set: { paymentMethod: "mixed" } }
      );
      mixedCount++;
    }

    console.log(
      `✅ Updated ${mixedCount} high-value cash transactions to 'mixed' payment method`
    );

    // Final verification - show updated distribution
    const finalQuery = {
      timestamp: {
        $gte: new Date("2025-10-01T00:00:00.000Z"),
        $lt: new Date("2025-11-01T00:00:00.000Z"),
      },
      "items.category": "Alcohol",
    };

    const finalTransactions = await collection.find(finalQuery).toArray();
    const finalStats = {};

    finalTransactions.forEach((transaction) => {
      finalStats[transaction.paymentMethod] =
        (finalStats[transaction.paymentMethod] || 0) + 1;
    });

    console.log(
      `\n💳 Updated payment method distribution (${finalTransactions.length} total):`
    );
    Object.entries(finalStats).forEach(([method, count]) => {
      const percentage = ((count / finalTransactions.length) * 100).toFixed(1);
      console.log(`${method}: ${count} transactions (${percentage}%)`);
    });
  } catch (error) {
    console.error(
      "Error standardizing October alcohol payment methods:",
      error
    );
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

// Run the standardization script
standardizeOctoberAlcoholPaymentMethods();
