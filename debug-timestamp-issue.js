const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function debugTimestampIssue() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Check a few OLG transactions and their timestamp format
    console.log("\n🔍 Checking OLG transaction timestamp formats...");

    const olgTransactions = await collection
      .find({
        id: { $regex: /^olg_/ },
      })
      .limit(5)
      .toArray();

    console.log(`Found ${olgTransactions.length} OLG transactions`);

    olgTransactions.forEach((t, i) => {
      console.log(`\n${i + 1}. ID: ${t.id}`);
      console.log(`   Timestamp: ${t.timestamp}`);
      console.log(`   Timestamp type: ${typeof t.timestamp}`);
      console.log(`   Is Date object: ${t.timestamp instanceof Date}`);
      console.log(`   Parsed Date: ${new Date(t.timestamp)}`);
      console.log(
        `   Items: ${t.items.length} (first: ${t.items[0]?.name} - ${t.items[0]?.category})`
      );
    });

    // Test different date queries to see what works
    console.log(`\n🧪 Testing different date query approaches...`);

    // Test 1: ISO string comparison
    console.log(`\n1. ISO String comparison:`);
    const isoQuery = {
      timestamp: {
        $gte: "2025-10-01T00:00:00.000Z",
        $lt: "2025-11-01T00:00:00.000Z",
      },
    };
    const isoCount = await collection.countDocuments(isoQuery);
    console.log(`   ISO query found: ${isoCount} transactions`);

    // Test 2: Date object comparison
    console.log(`\n2. Date object comparison:`);
    const dateQuery = {
      timestamp: {
        $gte: new Date("2025-10-01T00:00:00.000Z"),
        $lt: new Date("2025-11-01T00:00:00.000Z"),
      },
    };
    const dateCount = await collection.countDocuments(dateQuery);
    console.log(`   Date object query found: ${dateCount} transactions`);

    // Test 3: Just looking for OLG transactions
    console.log(`\n3. All OLG transactions:`);
    const olgCount = await collection.countDocuments({
      id: { $regex: /^olg_/ },
    });
    console.log(`   Total OLG transactions: ${olgCount}`);

    // Test 4: OLG transactions with proper timestamps
    console.log(`\n4. OLG transactions in October (ISO):`);
    const olgOctoberCount = await collection.countDocuments({
      id: { $regex: /^olg_/ },
      timestamp: {
        $gte: "2025-10-01T00:00:00.000Z",
        $lt: "2025-11-01T00:00:00.000Z",
      },
    });
    console.log(`   OLG October transactions: ${olgOctoberCount}`);

    // Test 5: All October transactions
    console.log(`\n5. All October 2025 transactions:`);
    const allOctoberCount = await collection.countDocuments({
      timestamp: {
        $gte: "2025-10-01T00:00:00.000Z",
        $lt: "2025-11-01T00:00:00.000Z",
      },
    });
    console.log(`   All October transactions: ${allOctoberCount}`);

    // Check what the API is actually using
    console.log(`\n6. API mongo.js logic simulation:`);
    const monthFilter = "2025-10";
    const [year, month] = monthFilter.split("-");
    const monthStart = new Date(
      parseInt(year),
      parseInt(month) - 1,
      1,
      0,
      0,
      0,
      0
    );
    const monthEnd = new Date(parseInt(year), parseInt(month), 1, 0, 0, 0, 0);

    console.log(`   Month start: ${monthStart.toISOString()}`);
    console.log(`   Month end: ${monthEnd.toISOString()}`);

    const apiQuery = {
      timestamp: {
        $gte: monthStart,
        $lt: monthEnd,
      },
    };
    const apiCount = await collection.countDocuments(apiQuery);
    console.log(`   API logic query found: ${apiCount} transactions`);
  } catch (error) {
    console.error("❌ Error debugging timestamp issue:", error);
  } finally {
    await client.close();
    console.log("\n🔒 Database connection closed");
  }
}

// Run the debug
debugTimestampIssue();
