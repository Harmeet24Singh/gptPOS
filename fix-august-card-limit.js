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

    // First, get current August card transaction totals
    const currentCardTotal = await transactionCollection
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
            total: { $sum: "$cardAmount" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const currentTotal = currentCardTotal[0]?.total || 0;
    const currentCount = currentCardTotal[0]?.count || 0;

    console.log(`📊 Current August card transactions:`);
    console.log(`   Total amount: $${currentTotal.toFixed(2)}`);
    console.log(`   Transaction count: ${currentCount}`);

    if (currentTotal <= 15000) {
      console.log("✅ Card total is already within limit. No changes needed.");
      return;
    }

    // Target: keep card amount around $14,500-$14,900
    const targetCardAmount = 14700; // Middle of the range
    const excessAmount = currentTotal - targetCardAmount;

    console.log(`🎯 Target card amount: $${targetCardAmount.toFixed(2)}`);
    console.log(`💸 Excess to convert: $${excessAmount.toFixed(2)}`);

    // Get all August card transactions, sorted randomly
    const cardTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-08-01T00:00:00.000Z"),
          $lt: new Date("2025-09-01T00:00:00.000Z"),
        },
        transactionType: "card",
      })
      .toArray();

    console.log(`🔍 Debug: Sample transaction structure:`);
    if (cardTransactions.length > 0) {
      const sample = cardTransactions[0];
      console.log(`   cardAmount: ${sample.cardAmount}`);
      console.log(`   total: ${sample.total}`);
      console.log(`   cashAmount: ${sample.cashAmount}`);
    }

    // Shuffle the array for random selection
    for (let i = cardTransactions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardTransactions[i], cardTransactions[j]] = [
        cardTransactions[j],
        cardTransactions[i],
      ];
    }

    console.log(
      `🔄 Found ${cardTransactions.length} card transactions to process...`
    );

    // Convert transactions to cash until we reach target
    let convertedAmount = 0;
    let convertedCount = 0;
    const transactionsToUpdate = [];

    for (const transaction of cardTransactions) {
      if (convertedAmount >= excessAmount) break;

      const txAmount = transaction.cardAmount || transaction.total || 0;

      // Convert this transaction from card to cash
      transactionsToUpdate.push({
        transactionId: transaction.transactionId,
        originalAmount: txAmount,
      });

      convertedAmount += txAmount;
      convertedCount++;
    }

    console.log(
      `\n🔄 Converting ${convertedCount} transactions from card to cash...`
    );
    console.log(
      `💰 Total amount being converted: $${convertedAmount.toFixed(2)}`
    );

    // Update transactions in batches
    let updateCount = 0;
    for (const tx of transactionsToUpdate) {
      const result = await transactionCollection.updateOne(
        { transactionId: tx.transactionId },
        {
          $set: {
            transactionType: "cash",
            cashAmount: tx.originalAmount,
            cardAmount: 0,
            paymentBreakdown: [
              {
                method: "cash",
                amount: tx.originalAmount,
              },
            ],
          },
        }
      );

      if (result.modifiedCount > 0) {
        updateCount++;
      }

      // Progress indicator
      if (updateCount % 50 === 0) {
        console.log(`   Updated ${updateCount} transactions...`);
      }
    }

    console.log(`✅ Successfully updated ${updateCount} transactions`);

    // Verification - check new totals
    const newCardTotal = await transactionCollection
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
            total: { $sum: "$cardAmount" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const newCashTotal = await transactionCollection
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date("2025-08-01T00:00:00.000Z"),
              $lt: new Date("2025-09-01T00:00:00.000Z"),
            },
            transactionType: "cash",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$cashAmount" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const newCardTotalAmount = newCardTotal[0]?.total || 0;
    const newCardTotalCount = newCardTotal[0]?.count || 0;
    const newCashTotalAmount = newCashTotal[0]?.total || 0;
    const newCashTotalCount = newCashTotal[0]?.count || 0;

    console.log(`\n✅ Verification - New August totals:`);
    console.log(`💳 Card transactions:`);
    console.log(
      `   Amount: $${newCardTotalAmount.toFixed(
        2
      )} (was $${currentTotal.toFixed(2)})`
    );
    console.log(`   Count: ${newCardTotalCount} (was ${currentCount})`);
    console.log(`💵 Cash transactions:`);
    console.log(`   Amount: $${newCashTotalAmount.toFixed(2)}`);
    console.log(`   Count: ${newCashTotalCount}`);

    const reduction = currentTotal - newCardTotalAmount;
    console.log(`\n📉 Card amount reduced by: $${reduction.toFixed(2)}`);
    console.log(`🎯 Target range: $14,500 - $14,900`);

    if (newCardTotalAmount >= 14500 && newCardTotalAmount <= 14900) {
      console.log(`✅ SUCCESS: Card amount is now within target range!`);
    } else if (newCardTotalAmount < 14500) {
      console.log(
        `⚠️  Card amount is below target range (but still acceptable)`
      );
    } else {
      console.log(`⚠️  Card amount is still above target range`);
    }

    console.log(`\n🎉 August card limit fix complete!`);
  } catch (error) {
    console.error("Error fixing August card limit:", error);
  } finally {
    await client.close();
  }
}

fixAugustCardLimit();
