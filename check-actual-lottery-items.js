const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function checkActualLotteryItems() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const inventoryCollection = db.collection("inventory");
    const transactionCollection = db.collection("transactions");

    console.log("\n🎰 Checking ACTUAL Database Lottery Items...");

    // Check ALL inventory items to see what lottery items exist
    const allItems = await inventoryCollection.find({}).toArray();

    const lottoItems = allItems.filter(
      (item) => item.category && item.category.toLowerCase().includes("lott")
    );

    console.log(`\n📋 ALL Lottery Items in Database:`);
    lottoItems.forEach((item, index) => {
      console.log(
        `   ${index + 1}. Category: "${item.category}" | Name: "${
          item.name
        }" | Price: $${item.price} | Stock: ${item.stock}`
      );
    });

    // Check December transactions to see what actual names are used
    console.log(`\n🗓️ December Lottery Transaction Items (Actual Names Used):`);

    const decemberTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-12-01T00:00:00.000Z"),
          $lt: new Date("2026-01-01T00:00:00.000Z"),
        },
      })
      .toArray();

    const lotteryItemsFromTransactions = new Set();

    decemberTransactions.forEach((transaction) => {
      transaction.items.forEach((item) => {
        if (
          item.category &&
          (item.category.toLowerCase().includes("lott") ||
            item.name.toLowerCase().includes("lott"))
        ) {
          lotteryItemsFromTransactions.add(
            `${item.category}: ${item.name} ($${item.price})`
          );
        }
      });
    });

    console.log(`\nLottery items found in December transactions:`);
    Array.from(lotteryItemsFromTransactions)
      .sort()
      .forEach((item, index) => {
        console.log(`   ${index + 1}. ${item}`);
      });

    // Check current July card usage
    console.log(`\n💳 Checking Current July Card Usage...`);
    const julyCardTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
        paymentMethod: "card",
      })
      .toArray();

    const julyCardTotal = julyCardTransactions.reduce(
      (sum, t) => sum + t.total,
      0
    );
    console.log(`   July Card Total: $${julyCardTotal.toFixed(2)}`);
    console.log(`   Card Limit: $15,000`);
    console.log(
      `   Status: ${julyCardTotal > 15000 ? "❌ OVER LIMIT" : "✅ Under limit"}`
    );
    console.log(
      `   Available card capacity: $${Math.max(
        0,
        15000 - julyCardTotal
      ).toFixed(2)}`
    );

    // Check all categories to understand the structure
    console.log(`\n📊 All Categories in Database:`);
    const categories = await inventoryCollection.distinct("category");
    categories.sort().forEach((category) => {
      console.log(`   - ${category}`);
    });
  } catch (error) {
    console.error("Error checking lottery items:", error);
  } finally {
    await client.close();
  }
}

checkActualLotteryItems();
