require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB;

async function checkAllMonths() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Check multiple months
    const months = [
      {
        name: "October 2024",
        start: "2024-10-01T00:00:00.000Z",
        end: "2024-11-01T00:00:00.000Z",
      },
      {
        name: "November 2024",
        start: "2024-11-01T00:00:00.000Z",
        end: "2024-12-01T00:00:00.000Z",
      },
      {
        name: "December 2024",
        start: "2024-12-01T00:00:00.000Z",
        end: "2025-01-01T00:00:00.000Z",
      },
      {
        name: "January 2025",
        start: "2025-01-01T00:00:00.000Z",
        end: "2025-02-01T00:00:00.000Z",
      },
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

    for (const month of months) {
      console.log(`\n📅 Checking ${month.name}...`);

      const totalTransactions = await collection.countDocuments({
        timestamp: {
          $gte: month.start,
          $lt: month.end,
        },
      });

      if (totalTransactions > 0) {
        console.log(`  Total transactions: ${totalTransactions}`);

        // Get category breakdown
        const pipeline = [
          {
            $match: {
              timestamp: {
                $gte: month.start,
                $lt: month.end,
              },
            },
          },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.category",
              count: { $sum: 1 },
              transactions: { $addToSet: "$_id" },
            },
          },
          { $sort: { count: -1 } },
        ];

        const categories = await collection.aggregate(pipeline).toArray();
        categories.forEach((cat) => {
          console.log(
            `    "${cat._id}": ${cat.count} items (${cat.transactions.length} transactions)`
          );
        });
      } else {
        console.log(`  No transactions found`);
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("\n🔒 Database connection closed");
  }
}

checkAllMonths();
