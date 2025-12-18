require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB;

async function testFixedFilter() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Test the fixed month filtering for October 2025
    const year = "2025";
    const month = "10";
    const monthStart = `${year}-${month.padStart(2, "0")}-01T00:00:00.000Z`;
    const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
    const nextYear =
      parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
    const monthEnd = `${nextYear}-${nextMonth
      .toString()
      .padStart(2, "0")}-01T00:00:00.000Z`;

    // The new fixed query (handles both string and Date timestamps)
    const fixedQuery = {
      $or: [
        {
          timestamp: {
            $gte: monthStart,
            $lt: monthEnd,
          },
        },
        {
          timestamp: {
            $gte: new Date(monthStart),
            $lt: new Date(monthEnd),
          },
        },
      ],
    };

    const totalCount = await collection.countDocuments(fixedQuery);
    console.log(
      `🎯 October 2025 with fixed filter: ${totalCount} transactions`
    );

    // Get category breakdown
    const pipeline = [
      { $match: fixedQuery },
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
    console.log("\n📊 Category breakdown:");
    categories.forEach((cat) => {
      console.log(
        `  "${cat._id}": ${cat.count} items (${cat.transactions.length} transactions)`
      );
    });

    // Test other months too
    const testMonths = [
      { name: "November 2025", month: "11" },
      { name: "December 2025", month: "12" },
    ];

    for (const testMonth of testMonths) {
      const testMonthStart = `2025-${testMonth.month.padStart(
        2,
        "0"
      )}-01T00:00:00.000Z`;
      const testNextMonth =
        parseInt(testMonth.month) === 12 ? 1 : parseInt(testMonth.month) + 1;
      const testNextYear = parseInt(testMonth.month) === 12 ? 2026 : 2025;
      const testMonthEnd = `${testNextYear}-${testNextMonth
        .toString()
        .padStart(2, "0")}-01T00:00:00.000Z`;

      const testQuery = {
        $or: [
          {
            timestamp: {
              $gte: testMonthStart,
              $lt: testMonthEnd,
            },
          },
          {
            timestamp: {
              $gte: new Date(testMonthStart),
              $lt: new Date(testMonthEnd),
            },
          },
        ],
      };

      const testCount = await collection.countDocuments(testQuery);
      console.log(`\n🗓️ ${testMonth.name}: ${testCount} transactions`);

      if (testCount > 0) {
        const testCategories = await collection
          .aggregate([
            { $match: testQuery },
            { $unwind: "$items" },
            {
              $group: {
                _id: "$items.category",
                count: { $sum: 1 },
                transactions: { $addToSet: "$_id" },
              },
            },
            { $sort: { count: -1 } },
          ])
          .toArray();

        testCategories.forEach((cat) => {
          console.log(
            `  "${cat._id}": ${cat.count} items (${cat.transactions.length} transactions)`
          );
        });
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("\n🔒 Database connection closed");
  }
}

testFixedFilter();
