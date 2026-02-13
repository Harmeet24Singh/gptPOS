const { MongoClient } = require("mongodb");
require("dotenv").config();

const url = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function calculateTodaysSalesBreakdown() {
  const client = new MongoClient(url);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysTransactions = await collection
      .find({
        timestamp: {
          $gte: today.toISOString(),
          $lt: tomorrow.toISOString(),
        },
      })
      .sort({ timestamp: -1 })
      .toArray();

    console.log(`\n💰 Calculating Today's Sales Breakdown:`);
    console.log(`📅 Date: ${today.toDateString()}`);
    console.log(`📊 Total transactions: ${todaysTransactions.length}`);

    let salesTotal = 0;
    let lottoPayouts = 0;
    let regularSales = 0;
    let negativeTransactions = [];
    let positiveTransactions = [];

    todaysTransactions.forEach((transaction, index) => {
      const total = transaction.total || 0;

      if (total < 0) {
        negativeTransactions.push(transaction);
        lottoPayouts += Math.abs(total);
        console.log(
          `❌ Negative: $${total.toFixed(2)} - ${transaction.items?.[0]?.name || "Unknown"}`,
        );
      } else {
        positiveTransactions.push(transaction);
        regularSales += total;
        salesTotal += total;
      }
    });

    console.log(
      `\n📈 Regular Sales: $${regularSales.toFixed(2)} (${positiveTransactions.length} transactions)`,
    );
    console.log(
      `📉 Lotto Payouts: $${lottoPayouts.toFixed(2)} (${negativeTransactions.length} transactions)`,
    );
    console.log(`🏦 Net Total: $${(regularSales - lottoPayouts).toFixed(2)}`);

    // Check what the transactions page might be calculating
    console.log(`\n🤔 Possible calculations:`);
    console.log(`   Only positive transactions: $${regularSales.toFixed(2)}`);
    console.log(
      `   Net (positive - negative): $${(regularSales - lottoPayouts).toFixed(2)}`,
    );
    console.log(`   Expected from UI: $110.96`);

    // Let's see if excluding the biggest negative transaction gives us closer to 110.96
    const transactionsExcludingBigPayout = todaysTransactions.filter(
      (tx) => tx.total !== -500,
    );
    const totalExcludingBigPayout = transactionsExcludingBigPayout.reduce(
      (sum, tx) => sum + (tx.total || 0),
      0,
    );
    console.log(
      `   Excluding -$500 payout: $${totalExcludingBigPayout.toFixed(2)}`,
    );

    // Check if positive sales only equals 110.96
    if (Math.abs(regularSales - 110.96) < 0.01) {
      console.log(
        `\n🎯 FOUND IT! The UI is showing only POSITIVE transactions: $${regularSales.toFixed(2)}`,
      );
    }

    return {
      totalTransactions: todaysTransactions.length,
      regularSales: regularSales,
      lottoPayouts: lottoPayouts,
      netTotal: regularSales - lottoPayouts,
    };
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

calculateTodaysSalesBreakdown();
