const { MongoClient } = require("mongodb");
require("dotenv").config();

const url = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function checkTimezoneIssue() {
  const client = new MongoClient(url);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Get last 5 transactions to check timestamps
    const recentTransactions = await collection
      .find({})
      .sort({ timestamp: -1 })
      .limit(5)
      .toArray();

    console.log("\n🕒 Checking timestamp formats:");
    console.log("Local time now:", new Date().toLocaleString());
    console.log("Local date string:", new Date().toDateString());
    console.log("UTC time now:", new Date().toISOString());

    recentTransactions.forEach((tx, index) => {
      const txDate = new Date(tx.timestamp);
      console.log(
        `\n${index + 1}. Transaction ${tx._id.toString().slice(-8)}:`,
      );
      console.log(`   Raw timestamp: ${tx.timestamp}`);
      console.log(`   As Date object: ${txDate.toString()}`);
      console.log(`   Local string: ${txDate.toLocaleString()}`);
      console.log(`   Date string: ${txDate.toDateString()}`);
      console.log(`   Total: $${(tx.total || 0).toFixed(2)}`);
    });

    // Now check for today's transactions using the same logic as the frontend
    const today = new Date().toDateString();
    console.log(`\n🔍 Filtering for today: ${today}`);

    const todaysTransactions = await collection.find({}).toArray();
    const filteredToday = todaysTransactions.filter(
      (tx) => new Date(tx.timestamp).toDateString() === today,
    );

    console.log(`📊 Total transactions in DB: ${todaysTransactions.length}`);
    console.log(`📊 Today's transactions: ${filteredToday.length}`);

    if (filteredToday.length > 0) {
      let positiveSales = 0;
      let totalSales = 0;

      console.log("\n📋 Today's transactions:");
      filteredToday.forEach((tx, index) => {
        const total = tx.total || 0;
        totalSales += total;
        if (total > 0) {
          positiveSales += total;
        }

        console.log(
          `${index + 1}. $${total.toFixed(2)} at ${new Date(tx.timestamp).toLocaleString()}`,
        );
      });

      console.log(
        `\n💰 Total sales (including negatives): $${totalSales.toFixed(2)}`,
      );
      console.log(`💰 Positive sales only: $${positiveSales.toFixed(2)}`);
      console.log(`🎯 Expected from UI: $110.96`);

      if (Math.abs(positiveSales - 110.96) < 0.01) {
        console.log("✅ MATCH FOUND! UI is showing positive sales only");
      } else if (Math.abs(totalSales - 110.96) < 0.01) {
        console.log("✅ MATCH FOUND! UI is showing total sales");
      } else {
        console.log("❌ No direct match found");
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

checkTimezoneIssue();
