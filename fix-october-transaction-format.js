const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function fixOctoberTransactionFormat() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Get all October alcohol transactions that need fixing
    const query = {
      timestamp: {
        $gte: new Date("2025-10-01T00:00:00.000Z"),
        $lt: new Date("2025-11-01T00:00:00.000Z"),
      },
      "items.category": "Alcohol",
    };

    const transactions = await collection.find(query).toArray();
    console.log(
      `Found ${transactions.length} October alcohol transactions to fix`
    );

    let updateCount = 0;
    let cashCount = 0;
    let cardCount = 0;

    // Calculate distribution: 70% cash, 30% card
    const totalTransactions = transactions.length;
    const targetCashCount = Math.round(totalTransactions * 0.7);

    console.log(
      `Target distribution: ${targetCashCount} cash (70%), ${
        totalTransactions - targetCashCount
      } card (30%)`
    );

    // Shuffle transactions for random distribution
    const shuffled = [...transactions].sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffled.length; i++) {
      const transaction = shuffled[i];
      const paymentMethod = i < targetCashCount ? "cash" : "card";
      const totalAmount = transaction.total;

      // Create correct paymentBreakdown format (array of objects)
      const correctPaymentBreakdown = [
        {
          method: paymentMethod,
          amount: totalAmount,
        },
      ];

      // Update transaction with correct format and additional required fields
      const updateFields = {
        paymentBreakdown: correctPaymentBreakdown,
        paymentMethod: paymentMethod, // Keep this for compatibility
        transactionType: paymentMethod,
        cashAmount: paymentMethod === "cash" ? totalAmount : 0,
        cardAmount: paymentMethod === "card" ? totalAmount : 0,
        creditAmount: 0,
        cashback: 0,
        change: 0,
        taxableAmount: transaction.subtotal || 0,
        nonTaxableAmount: 0,
      };

      await collection.updateOne(
        { _id: transaction._id },
        { $set: updateFields }
      );

      updateCount++;
      if (paymentMethod === "cash") cashCount++;
      else cardCount++;
    }

    console.log(`✅ Successfully fixed ${updateCount} transactions`);
    console.log(
      `💳 Final distribution: ${cashCount} cash (${(
        (cashCount / updateCount) *
        100
      ).toFixed(1)}%), ${cardCount} card (${(
        (cardCount / updateCount) *
        100
      ).toFixed(1)}%)`
    );

    // Verify one updated transaction
    const verifyTransaction = await collection.findOne({
      timestamp: {
        $gte: new Date("2025-10-01T00:00:00.000Z"),
        $lt: new Date("2025-11-01T00:00:00.000Z"),
      },
      "items.category": "Alcohol",
    });

    console.log("\n📄 Sample fixed transaction:");
    console.log({
      transactionId: verifyTransaction.transactionId,
      total: verifyTransaction.total,
      transactionType: verifyTransaction.transactionType,
      paymentBreakdown: verifyTransaction.paymentBreakdown,
      cashAmount: verifyTransaction.cashAmount,
      cardAmount: verifyTransaction.cardAmount,
    });
  } catch (error) {
    console.error("Error fixing October transaction format:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

// Run the fix script
fixOctoberTransactionFormat();
