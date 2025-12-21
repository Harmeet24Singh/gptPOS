require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function debugAllData() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("convenience_store");

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log("\n📁 Available collections:");
    collections.forEach((collection) => {
      console.log(`- ${collection.name}`);
    });

    // Check transactions collection
    const transCollection = db.collection("transactions");

    const totalCount = await transCollection.countDocuments();
    console.log(`\n📊 Total transactions in database: ${totalCount}`);

    // Check recent transactions
    const recentTransactions = await transCollection
      .find()
      .sort({ _id: -1 })
      .limit(5)
      .toArray();

    console.log("\n🔍 Recent transactions (last 5):");
    recentTransactions.forEach((t) => {
      console.log(
        `- ID: ${t.transactionId || "N/A"}, Timestamp: ${t.timestamp}, Date: ${
          t.date || "N/A"
        }, Category: ${t.category || "N/A"}, Total: $${t.total}`
      );
    });

    // Check for July 2025 data by timestamp
    const julyByTimestamp = await transCollection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00Z"),
          $lt: new Date("2025-08-01T00:00:00Z"),
        },
      })
      .count();

    console.log(`\n📅 July 2025 transactions by timestamp: ${julyByTimestamp}`);

    // Check categories
    const categories = await transCollection.distinct("category");
    console.log(`\n🏷️ Available categories: ${categories.join(", ")}`);

    // Check for grocery items
    const groceryByItems = await transCollection
      .find({
        "items.category": "Grocery",
      })
      .count();

    console.log(`\n🛒 Transactions with grocery items: ${groceryByItems}`);
  } catch (error) {
    console.error("❌ Debug error:", error);
  } finally {
    await client.close();
  }
}

debugAllData();
