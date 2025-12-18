const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function debugLotteryFilter() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Check October 2025 transactions with Lotto category
    console.log(
      "\n🔍 Checking October 2025 transactions with 'Lotto' category..."
    );

    const lottoTransactions = await collection
      .find({
        timestamp: {
          $gte: "2025-10-01T00:00:00.000Z",
          $lt: "2025-11-01T00:00:00.000Z",
        },
        "items.category": "Lotto",
      })
      .toArray();

    console.log(
      `Found ${lottoTransactions.length} transactions with 'Lotto' category in October`
    );

    if (lottoTransactions.length > 0) {
      const totalRevenue = lottoTransactions.reduce(
        (sum, t) => sum + t.total,
        0
      );
      console.log(`Total Lotto revenue: $${totalRevenue.toFixed(2)}`);

      console.log("\n📋 Sample transactions:");
      lottoTransactions.slice(0, 3).forEach((t, i) => {
        console.log(
          `${i + 1}. ID: ${t.id || t._id}, Total: $${t.total}, Items: ${
            t.items.length
          }`
        );
        t.items.forEach((item) => {
          console.log(
            `   - ${item.name} (${item.category}) - $${item.price} x ${item.quantity}`
          );
        });
      });
    }

    // Also check for 'lotto' (lowercase)
    console.log("\n🔍 Checking for 'lotto' (lowercase) category...");

    const lottoLowerTransactions = await collection
      .find({
        timestamp: {
          $gte: "2025-10-01T00:00:00.000Z",
          $lt: "2025-11-01T00:00:00.000Z",
        },
        "items.category": "lotto",
      })
      .toArray();

    console.log(
      `Found ${lottoLowerTransactions.length} transactions with 'lotto' category in October`
    );

    // Check all unique categories in October
    console.log("\n📊 All unique categories in October 2025:");
    const pipeline = [
      {
        $match: {
          timestamp: {
            $gte: "2025-10-01T00:00:00.000Z",
            $lt: "2025-11-01T00:00:00.000Z",
          },
        },
      },
      { $unwind: "$items" },
      { $group: { _id: "$items.category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ];

    const categories = await collection.aggregate(pipeline).toArray();
    categories.forEach((cat) => {
      console.log(`  - "${cat._id}": ${cat.count} items`);
    });

    // Check transactions that might contain lottery keywords
    console.log("\n🎰 Checking for lottery-related item names...");

    const keywordTransactions = await collection
      .find({
        timestamp: {
          $gte: "2025-10-01T00:00:00.000Z",
          $lt: "2025-11-01T00:00:00.000Z",
        },
        $or: [
          { "items.name": { $regex: /lotto/i } },
          { "items.name": { $regex: /lottery/i } },
          { "items.name": { $regex: /instant/i } },
          { "items.name": { $regex: /scratch/i } },
          { "items.name": { $regex: /pick/i } },
        ],
      })
      .toArray();

    console.log(
      `Found ${keywordTransactions.length} transactions with lottery keywords in item names`
    );

    if (keywordTransactions.length > 0) {
      console.log("\n🎫 Sample lottery keyword transactions:");
      keywordTransactions.slice(0, 5).forEach((t, i) => {
        console.log(`${i + 1}. ID: ${t.id || t._id}, Total: $${t.total}`);
        t.items.forEach((item) => {
          if (item.name.match(/lotto|lottery|instant|scratch|pick/i)) {
            console.log(
              `   🎯 ${item.name} (${item.category || "No category"}) - $${
                item.price
              } x ${item.quantity}`
            );
          }
        });
      });
    }
  } catch (error) {
    console.error("❌ Error debugging lottery filter:", error);
  } finally {
    await client.close();
    console.log("\n🔒 Database connection closed");
  }
}

// Run the debug script
debugLotteryFilter();
