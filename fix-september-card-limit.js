const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function fixSeptemberCardLimit() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const transactionCollection = db.collection("transactions");

    console.log("\n💳 Fixing September 2025 card transaction limit...");

    // Get current card total
    const totals = await transactionCollection
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date("2025-09-01T00:00:00.000Z"),
              $lt: new Date("2025-10-01T00:00:00.000Z"),
            },
            transactionType: "card",
          },
        },
        {
          $group: {
            _id: null,
            totalCardAmount: { $sum: "$cardAmount" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const currentCardTotal = totals[0]?.totalCardAmount || 0;
    const count = totals[0]?.count || 0;

    console.log(
      `📊 Current September card transactions: ${count} transactions, $${currentCardTotal.toFixed(
        2
      )}`
    );

    if (currentCardTotal <= 12000) {
      console.log("✅ Card total is already below $12k!");
      return;
    }

    const targetAmount = 11800; // Target slightly below 12k
    const excessAmount = currentCardTotal - targetAmount;

    console.log(
      `🎯 Target: $${targetAmount}, Need to convert: $${excessAmount.toFixed(
        2
      )}`
    );

    // Get card transactions sorted by amount (largest first for efficiency)
    const cardTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-09-01T00:00:00.000Z"),
          $lt: new Date("2025-10-01T00:00:00.000Z"),
        },
        transactionType: "card",
        cardAmount: { $gt: 0 },
      })
      .sort({ cardAmount: -1 })
      .toArray();

    console.log(
      `🔄 Processing ${cardTransactions.length} card transactions...`
    );

    // Convert transactions one by one until we reach target
    let convertedAmount = 0;
    let convertedCount = 0;

    for (const tx of cardTransactions) {
      if (convertedAmount >= excessAmount) break;

      const amount = tx.cardAmount;

      const updateResult = await transactionCollection.updateOne(
        { transactionId: tx.transactionId },
        {
          $set: {
            transactionType: "cash",
            cashAmount: amount,
            cardAmount: 0,
            paymentBreakdown: [{ method: "cash", amount: amount }],
          },
        }
      );

      if (updateResult.modifiedCount > 0) {
        convertedAmount += amount;
        convertedCount++;
        console.log(
          `   Converted transaction ${tx.transactionId}: $${amount.toFixed(
            2
          )} (total: $${convertedAmount.toFixed(2)})`
        );

        // Continue until we've converted enough
        if (convertedAmount >= excessAmount) break;
      }
    }

    console.log(
      `\n✅ Converted ${convertedCount} transactions, total: $${convertedAmount.toFixed(
        2
      )}`
    );

    // Final verification
    const newTotals = await transactionCollection
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date("2025-09-01T00:00:00.000Z"),
              $lt: new Date("2025-10-01T00:00:00.000Z"),
            },
            transactionType: "card",
          },
        },
        {
          $group: {
            _id: null,
            totalCardAmount: { $sum: "$cardAmount" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const newCardTotal = newTotals[0]?.totalCardAmount || 0;
    const newCount = newTotals[0]?.count || 0;

    console.log(`\n🎉 Final result:`);
    console.log(`   Card transactions: ${newCount} (was ${count})`);
    console.log(
      `   Card total: $${newCardTotal.toFixed(
        2
      )} (was $${currentCardTotal.toFixed(2)})`
    );
    console.log(`   Target: Below $12,000`);

    if (newCardTotal < 12000) {
      console.log(`✅ SUCCESS: Card total is now below $12k!`);
    } else {
      console.log(`⚠️  Still above $12k. Run script again to convert more.`);
    }

    // Show breakdown by category
    const categoryBreakdown = await transactionCollection
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date("2025-09-01T00:00:00.000Z"),
              $lt: new Date("2025-10-01T00:00:00.000Z"),
            },
            transactionType: "card",
          },
        },
        {
          $unwind: "$items",
        },
        {
          $group: {
            _id: "$items.category",
            cardAmount: { $sum: "$cardAmount" },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { cardAmount: -1 },
        },
      ])
      .toArray();

    console.log(`\n📊 September card transactions by category:`);
    categoryBreakdown.forEach((cat) => {
      console.log(
        `   ${cat._id}: $${cat.cardAmount.toFixed(2)} (${
          cat.count
        } transactions)`
      );
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

fixSeptemberCardLimit();
