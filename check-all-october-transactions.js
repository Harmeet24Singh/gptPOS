const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function checkAllOctoberTransactions() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Test what the fixed API returns now
    console.log("\n🔍 Checking what transactions exist in October 2025...");

    const monthFilter = "2025-10";
    const [year, month] = monthFilter.split("-");
    const monthStart = `${year}-${month.padStart(2, "0")}-01T00:00:00.000Z`;
    const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
    const nextYear =
      parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
    const monthEnd = `${nextYear}-${nextMonth
      .toString()
      .padStart(2, "0")}-01T00:00:00.000Z`;

    const dateQuery = {
      timestamp: {
        $gte: monthStart,
        $lt: monthEnd,
      },
    };

    console.log(`Date range: ${monthStart} to ${monthEnd}`);

    // Count total transactions
    const totalCount = await collection.countDocuments(dateQuery);
    console.log(`Total October 2025 transactions: ${totalCount}`);

    // Break down by ID patterns
    const olgCount = await collection.countDocuments({
      ...dateQuery,
      id: { $regex: /^olg_/ },
    });

    const alcoholCount = await collection.countDocuments({
      ...dateQuery,
      id: { $regex: /^alc_/ },
    });

    const groceryCount = await collection.countDocuments({
      ...dateQuery,
      id: { $regex: /^groc_/ },
    });

    const otherCount = await collection.countDocuments({
      ...dateQuery,
      id: {
        $not: { $regex: /^(olg_|alc_|groc_)/ },
      },
    });

    console.log(`\n📊 Breakdown by transaction type:`);
    console.log(`OLG Lottery: ${olgCount}`);
    console.log(`Alcohol: ${alcoholCount}`);
    console.log(`Grocery: ${groceryCount}`);
    console.log(`Other: ${otherCount}`);
    console.log(
      `Total: ${olgCount + alcoholCount + groceryCount + otherCount}`
    );

    // Check categories
    console.log(`\n📈 Categories in October 2025:`);
    const pipeline = [
      { $match: dateQuery },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.category",
          count: { $sum: 1 },
          transactions: { $addToSet: "$id" },
        },
      },
      { $sort: { count: -1 } },
    ];

    const categories = await collection.aggregate(pipeline).toArray();
    categories.forEach((cat) => {
      console.log(
        `  "${cat._id}": ${cat.count} items (${cat.transactions.length} transactions)`
      );
    });

    // Sample some non-lottery transactions
    console.log(`\n🔍 Sample non-lottery transactions:`);
    const nonLottoTransactions = await collection
      .find({
        ...dateQuery,
        "items.category": { $ne: "Lotto" },
      })
      .limit(5)
      .toArray();

    console.log(
      `Found ${nonLottoTransactions.length} non-lottery transactions`
    );

    nonLottoTransactions.forEach((t, i) => {
      console.log(
        `${i + 1}. ID: ${t.id || t._id}, Date: ${new Date(
          t.timestamp
        ).toLocaleDateString()}`
      );
      console.log(
        `   Items: ${t.items
          .map((item) => `${item.name} (${item.category})`)
          .join(", ")}`
      );
    });
  } catch (error) {
    console.error("❌ Error checking transactions:", error);
  } finally {
    await client.close();
    console.log("\n🔒 Database connection closed");
  }
}

// Run the check
checkAllOctoberTransactions();
