const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function updateOctoberAlcoholPaymentMethods() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

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
      `Found ${transactions.length} October alcohol transactions to update`
    );

    // Calculate distribution: 70% cash, 30% card
    const totalTransactions = transactions.length;
    const cashCount = Math.round(totalTransactions * 0.7);
    const cardCount = totalTransactions - cashCount;

    console.log(
      `Target distribution: ${cashCount} cash (70%), ${cardCount} card (30%)`
    );

    // Shuffle transactions for random distribution
    const shuffled = [...transactions].sort(() => Math.random() - 0.5);

    let updateCount = 0;

    // Update transactions with new payment methods
    for (let i = 0; i < shuffled.length; i++) {
      const transaction = shuffled[i];
      const newPaymentMethod = i < cashCount ? "cash" : "card";

      await collection.updateOne(
        { _id: transaction._id },
        { $set: { paymentMethod: newPaymentMethod } }
      );

      updateCount++;
    }

    console.log(
      `✅ Successfully updated ${updateCount} transactions with new payment methods`
    );

    // Verify the final distribution
    const verificationQuery = {
      timestamp: {
        $gte: new Date("2025-10-01T00:00:00.000Z"),
        $lt: new Date("2025-11-01T00:00:00.000Z"),
      },
      "items.category": "Alcohol",
    };

    const updatedTransactions = await collection
      .find(verificationQuery)
      .toArray();
    const paymentStats = {};

    updatedTransactions.forEach((transaction) => {
      paymentStats[transaction.paymentMethod] =
        (paymentStats[transaction.paymentMethod] || 0) + 1;
    });

    console.log(
      `\n💳 Final payment method distribution (${updatedTransactions.length} total):`
    );
    Object.entries(paymentStats).forEach(([method, count]) => {
      const percentage = ((count / updatedTransactions.length) * 100).toFixed(
        1
      );
      console.log(`${method}: ${count} transactions (${percentage}%)`);
    });
  } catch (error) {
    console.error("Error updating October alcohol payment methods:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

// Run the update script
updateOctoberAlcoholPaymentMethods();
