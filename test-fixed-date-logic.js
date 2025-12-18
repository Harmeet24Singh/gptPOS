const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function testFixedDateLogic() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Test the fixed date logic
    console.log("\n🧪 Testing fixed date logic...");

    const monthFilter = "2025-10";
    const [year, month] = monthFilter.split("-");
    const monthStart = `${year}-${month.padStart(2, "0")}-01T00:00:00.000Z`;
    const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
    const nextYear =
      parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
    const monthEnd = `${nextYear}-${nextMonth
      .toString()
      .padStart(2, "0")}-01T00:00:00.000Z`;

    console.log(`Month start: ${monthStart}`);
    console.log(`Month end: ${monthEnd}`);

    const dateQuery = {
      timestamp: {
        $gte: monthStart,
        $lt: monthEnd,
      },
    };

    const totalCount = await collection.countDocuments(dateQuery);
    console.log(`Total October transactions with fixed logic: ${totalCount}`);

    const olgCount = await collection.countDocuments({
      ...dateQuery,
      id: { $regex: /^olg_/ },
    });
    console.log(`OLG October transactions with fixed logic: ${olgCount}`);

    // Get some transactions and calculate lottery totals
    const transactions = await collection.find(dateQuery).limit(5000).toArray();
    console.log(`Fetched ${transactions.length} transactions for calculation`);

    let lotteryTotal = 0;
    let lotteryTransactionCount = 0;

    transactions.forEach((transaction) => {
      if (transaction.items && Array.isArray(transaction.items)) {
        let hasLottery = false;
        let transactionLotteryAmount = 0;

        transaction.items.forEach((item) => {
          if (item.category === "Lotto" || item.category === "lotto") {
            hasLottery = true;
            transactionLotteryAmount += item.price * item.quantity;
          }
        });

        if (hasLottery) {
          lotteryTotal += transactionLotteryAmount;
          lotteryTransactionCount++;
        }
      }
    });

    console.log(`\n🎰 Lottery calculation results:`);
    console.log(`Lottery transactions: ${lotteryTransactionCount}`);
    console.log(`Lottery total: $${lotteryTotal.toFixed(2)}`);
  } catch (error) {
    console.error("❌ Error testing fixed date logic:", error);
  } finally {
    await client.close();
    console.log("\n🔒 Database connection closed");
  }
}

// Run the test
testFixedDateLogic();
