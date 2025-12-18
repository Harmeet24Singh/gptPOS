require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB;

async function analyzeTimestamps() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Get all timestamps and their types
    const pipeline = [
      {
        $project: {
          timestamp: 1,
          timestampType: { $type: "$timestamp" },
          year: {
            $cond: {
              if: { $eq: [{ $type: "$timestamp" }, "string"] },
              then: { $toInt: { $substr: ["$timestamp", 0, 4] } },
              else: { $year: "$timestamp" },
            },
          },
          month: {
            $cond: {
              if: { $eq: [{ $type: "$timestamp" }, "string"] },
              then: { $toInt: { $substr: ["$timestamp", 5, 2] } },
              else: { $month: "$timestamp" },
            },
          },
        },
      },
      {
        $group: {
          _id: {
            year: "$year",
            month: "$month",
            type: "$timestampType",
          },
          count: { $sum: 1 },
          sampleTimestamp: { $first: "$timestamp" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ];

    const results = await collection.aggregate(pipeline).toArray();

    console.log("📊 Transaction distribution by month and timestamp type:");
    results.forEach((result) => {
      console.log(
        `${result._id.year}-${String(result._id.month).padStart(2, "0")} (${
          result._id.type
        }): ${result.count} transactions`
      );
      console.log(`  Sample: ${result.sampleTimestamp}`);
    });

    // Test our date filtering logic
    console.log("\n🧪 Testing date filtering logic:");

    const testMonths = [
      {
        name: "October 2025",
        start: "2025-10-01T00:00:00.000Z",
        end: "2025-11-01T00:00:00.000Z",
      },
      {
        name: "November 2025",
        start: "2025-11-01T00:00:00.000Z",
        end: "2025-12-01T00:00:00.000Z",
      },
      {
        name: "December 2025",
        start: "2025-12-01T00:00:00.000Z",
        end: "2026-01-01T00:00:00.000Z",
      },
    ];

    for (const month of testMonths) {
      // Test with string comparison (what we're doing now)
      const stringCount = await collection.countDocuments({
        timestamp: {
          $gte: month.start,
          $lt: month.end,
        },
      });

      // Test with mixed comparison (for Date objects)
      const mixedCount = await collection.countDocuments({
        $or: [
          {
            timestamp: {
              $gte: month.start,
              $lt: month.end,
            },
          },
          {
            timestamp: {
              $gte: new Date(month.start),
              $lt: new Date(month.end),
            },
          },
        ],
      });

      console.log(`${month.name}:`);
      console.log(`  String filter: ${stringCount}`);
      console.log(`  Mixed filter: ${mixedCount}`);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("\n🔒 Database connection closed");
  }
}

analyzeTimestamps();
