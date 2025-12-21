const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function fixAugustCardLimit() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const transactionCollection = db.collection("transactions");

    console.log("\n💳 Fixing August 2025 card transaction limit...");

    // First, let's see what we're dealing with
    const augustTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-08-01T00:00:00.000Z"),
          $lt: new Date("2025-09-01T00:00:00.000Z"),
        },
        transactionType: "card",
      })
      .limit(3)
      .toArray();

    console.log("Sample card transactions:");
    augustTransactions.forEach((tx, i) => {
      console.log(
        `  ${i + 1}. ID: ${tx.transactionId}, cardAmount: ${
          tx.cardAmount
        }, total: ${tx.total}`
      );
    });

    // Get current totals
    const totals = await transactionCollection
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date("2025-08-01T00:00:00.000Z"),
              $lt: new Date("2025-09-01T00:00:00.000Z"),
            },
            transactionType: "card",
          },
        },
        {
          $group: {
            _id: null,
            totalCardAmount: { $sum: "$cardAmount" },
            totalAmount: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const currentCardTotal = totals[0]?.totalCardAmount || 0;
    const currentTotal = totals[0]?.totalAmount || 0;
    const count = totals[0]?.count || 0;

    console.log(`\n📊 Current August card transactions:`);
    console.log(`   Count: ${count}`);
    console.log(`   Card Amount: $${currentCardTotal.toFixed(2)}`);
    console.log(`   Total Amount: $${currentTotal.toFixed(2)}`);

    if (currentCardTotal <= 15000) {
      console.log("✅ Card total is already within limit!");
      return;
    }

    // Target around $14,700
    const targetAmount = 14700;
    const excessAmount = currentCardTotal - targetAmount;

    console.log(`🎯 Target: $${targetAmount.toFixed(2)}`);
    console.log(
      `💸 Need to convert: $${excessAmount.toFixed(2)} from card to cash`
    );

    // Get transactions to convert, ordered by cardAmount descending (convert largest first for efficiency)
    const transactionsToConvert = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-08-01T00:00:00.000Z"),
          $lt: new Date("2025-09-01T00:00:00.000Z"),
        },
        transactionType: "card",
        cardAmount: { $gt: 0 },
      })
      .sort({ cardAmount: -1 })
      .toArray();

    console.log(
      `🔄 Found ${transactionsToConvert.length} card transactions to process`
    );

    // Convert transactions until we reach target
    let convertedAmount = 0;
    let convertedCount = 0;
    const updates = [];

    for (const tx of transactionsToConvert) {
      if (convertedAmount >= excessAmount) break;

      const amount = tx.cardAmount || tx.total || 0;

      updates.push({
        updateOne: {
          filter: { transactionId: tx.transactionId },
          update: {
            $set: {
              transactionType: "cash",
              cashAmount: amount,
              cardAmount: 0,
              paymentBreakdown: [{ method: "cash", amount: amount }],
            },
          },
        },
      });

      convertedAmount += amount;
      convertedCount++;
    }

    console.log(
      `\n🔄 Converting ${convertedCount} transactions (total: $${convertedAmount.toFixed(
        2
      )})`
    );

    // Perform bulk update
    if (updates.length > 0) {
      const result = await transactionCollection.bulkWrite(updates);
      console.log(`✅ Updated ${result.modifiedCount} transactions`);
    }

    // Verify results
    const newTotals = await transactionCollection
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date("2025-08-01T00:00:00.000Z"),
              $lt: new Date("2025-09-01T00:00:00.000Z"),
            },
          },
        },
        {
          $group: {
            _id: "$transactionType",
            totalAmount: { $sum: "$total" },
            cardAmount: { $sum: "$cardAmount" },
            cashAmount: { $sum: "$cashAmount" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    console.log(`\n✅ New August totals:`);
    newTotals.forEach((total) => {
      console.log(`   ${total._id}: ${total.count} transactions`);
      console.log(
        `     Card: $${total.cardAmount.toFixed(
          2
        )}, Cash: $${total.cashAmount.toFixed(2)}`
      );
    });

    const newCardTotal =
      newTotals.find((t) => t._id === "card")?.cardAmount || 0;
    console.log(
      `\n🎉 Final card total: $${newCardTotal.toFixed(
        2
      )} (target: $${targetAmount})`
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

fixAugustCardLimit();
