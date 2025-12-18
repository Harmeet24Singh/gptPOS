const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function updateOctoberAlcoholPaymentBreakdown() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // First, let's check the current structure of a transaction
    const sampleTransaction = await collection.findOne({
      timestamp: {
        $gte: new Date("2025-10-01T00:00:00.000Z"),
        $lt: new Date("2025-11-01T00:00:00.000Z"),
      },
      "items.category": "Alcohol",
    });

    console.log("Sample transaction structure:");
    console.log(JSON.stringify(sampleTransaction, null, 2));

    // Get all October alcohol transactions
    const query = {
      timestamp: {
        $gte: new Date("2025-10-01T00:00:00.000Z"),
        $lt: new Date("2025-11-01T00:00:00.000Z"),
      },
      "items.category": "Alcohol",
    };

    const transactions = await collection.find(query).toArray();
    console.log(
      `\nFound ${transactions.length} October alcohol transactions to update`
    );

    // Calculate distribution: 70% cash, 30% card
    const totalTransactions = transactions.length;
    const cashCount = Math.round(totalTransactions * 0.7);

    console.log(
      `Target distribution: ${cashCount} cash (70%), ${
        totalTransactions - cashCount
      } card (30%)`
    );

    // Shuffle transactions for random distribution
    const shuffled = [...transactions].sort(() => Math.random() - 0.5);

    let updateCount = 0;

    // Update transactions with proper paymentBreakdown
    for (let i = 0; i < shuffled.length; i++) {
      const transaction = shuffled[i];
      const paymentMethod = i < cashCount ? "cash" : "card";
      const totalAmount = transaction.total;

      // Create proper paymentBreakdown structure
      const paymentBreakdown = {
        method: [paymentMethod],
        amount: [totalAmount],
      };

      await collection.updateOne(
        { _id: transaction._id },
        {
          $set: {
            paymentBreakdown: paymentBreakdown,
            paymentMethod: paymentMethod, // Also update the main paymentMethod field
          },
        }
      );

      updateCount++;
    }

    console.log(
      `✅ Successfully updated ${updateCount} transactions with paymentBreakdown`
    );

    // Verify the final distribution
    const updatedTransactions = await collection.find(query).toArray();
    const paymentStats = {};

    updatedTransactions.forEach((transaction) => {
      if (transaction.paymentBreakdown && transaction.paymentBreakdown.method) {
        const method = transaction.paymentBreakdown.method[0]; // Get first method
        paymentStats[method] = (paymentStats[method] || 0) + 1;
      }
    });

    console.log(
      `\n💳 Final payment breakdown distribution (${updatedTransactions.length} total):`
    );
    Object.entries(paymentStats).forEach(([method, count]) => {
      const percentage = ((count / updatedTransactions.length) * 100).toFixed(
        1
      );
      console.log(`${method}: ${count} transactions (${percentage}%)`);
    });

    // Show sample updated transaction
    const sampleUpdated = await collection.findOne({
      timestamp: {
        $gte: new Date("2025-10-01T00:00:00.000Z"),
        $lt: new Date("2025-11-01T00:00:00.000Z"),
      },
      "items.category": "Alcohol",
      "paymentBreakdown.method": { $exists: true },
    });

    console.log("\n📄 Sample updated transaction paymentBreakdown:");
    console.log({
      transactionId: sampleUpdated.transactionId,
      total: sampleUpdated.total,
      paymentMethod: sampleUpdated.paymentMethod,
      paymentBreakdown: sampleUpdated.paymentBreakdown,
    });
  } catch (error) {
    console.error("Error updating October alcohol payment breakdown:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

// Run the update script
updateOctoberAlcoholPaymentBreakdown();
