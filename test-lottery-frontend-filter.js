const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function testFrontendFiltering() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Test the exact query that the frontend API would use for October 2025
    console.log("\n🔍 Testing frontend API query for October 2025...");

    // This mimics what happens when user selects "October 2025" in the frontend
    const apiQuery = {
      limit: "1000",
      dateFilter: "month",
      monthFilter: "2025-10",
    };

    console.log("API Query params:", apiQuery);

    // Build the date filter like the API does
    let dateFilter = {};

    if (apiQuery.monthFilter) {
      const monthStart = new Date(apiQuery.monthFilter + "-01T00:00:00.000Z");
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      dateFilter = {
        timestamp: {
          $gte: monthStart.toISOString(),
          $lt: monthEnd.toISOString(),
        },
      };

      console.log("Date filter:", dateFilter);
    }

    // Get transactions like the API would
    const transactions = await collection
      .find(dateFilter)
      .limit(parseInt(apiQuery.limit))
      .sort({ timestamp: -1 })
      .toArray();

    console.log(
      `Found ${transactions.length} total transactions for October 2025`
    );

    // Now apply the frontend lottery filtering logic
    console.log("\n🎰 Applying lottery filter logic...");

    const lotteryKeywords = [
      "lotto",
      "lottery",
      "scratch",
      "ticket",
      "powerball",
      "mega millions",
      "instant",
      "draw",
      "pick",
      "daily",
      "max",
      "win for life",
      "cash for life",
      "scratch off",
      "scratcher",
      "quick pick",
      "lotto max",
      "lotto 649",
      "super 7",
      "daily grand",
      "keno",
      "poker lotto",
      "sports select",
      "pro line",
      "point spread",
      "over under",
      "pools",
      "encore",
    ];

    const isLotteryItem = (item) => {
      // First check if category exists and is exactly 'Lotto' or 'lotto'
      if (
        item.category &&
        (item.category === "Lotto" || item.category === "lotto")
      ) {
        return true;
      }

      // Check name for lottery keywords
      if (item.name) {
        const itemNameLower = item.name.toLowerCase();
        const foundKeyword = lotteryKeywords.find((keyword) =>
          itemNameLower.includes(keyword)
        );
        if (foundKeyword) {
          return true;
        }
      }
      return false;
    };

    // Apply lottery breakdown calculation
    let lotteryTotal = 0;
    let lotteryTransactionCount = 0;
    let lotteryItemCount = 0;

    transactions.forEach((transaction) => {
      let hasLottery = false;
      let lotteryAmountInTransaction = 0;

      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach((item) => {
          if (isLotteryItem(item)) {
            hasLottery = true;
            lotteryAmountInTransaction += item.price * item.quantity;
            lotteryItemCount += item.quantity;
          }
        });
      }

      if (hasLottery) {
        lotteryTotal += lotteryAmountInTransaction;
        lotteryTransactionCount++;
      }
    });

    console.log(`\n📊 Lottery Sales Breakdown Results:`);
    console.log(`Total Revenue: $${lotteryTotal.toFixed(2)}`);
    console.log(`Transaction Count: ${lotteryTransactionCount}`);
    console.log(`Item Count: ${lotteryItemCount}`);

    // Check a few sample transactions
    console.log(`\n🔍 Sample lottery transactions found:`);
    const lotteryTransactions = transactions.filter((t) => {
      return (
        t.items &&
        Array.isArray(t.items) &&
        t.items.some((item) => isLotteryItem(item))
      );
    });

    lotteryTransactions.slice(0, 3).forEach((t, i) => {
      console.log(
        `${i + 1}. ID: ${t.id || t._id}, Date: ${new Date(
          t.timestamp
        ).toLocaleDateString()}, Total: $${t.total}`
      );
      t.items.forEach((item) => {
        if (isLotteryItem(item)) {
          console.log(
            `   ✅ ${item.name} (${item.category || "No category"}) - $${
              item.price
            } x ${item.quantity}`
          );
        }
      });
    });
  } catch (error) {
    console.error("❌ Error testing frontend filtering:", error);
  } finally {
    await client.close();
    console.log("\n🔒 Database connection closed");
  }
}

// Run the test
testFrontendFiltering();
