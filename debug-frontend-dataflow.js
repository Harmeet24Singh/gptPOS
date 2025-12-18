const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function debugFrontendDataFlow() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Test the exact API call that frontend makes
    console.log("\n🔍 Testing the exact API call for October 2025...");

    // Build the date filter exactly like the API does
    let dateQuery = {};
    const monthFilter = "2025-10";

    if (monthFilter) {
      const monthStart = new Date(monthFilter + "-01");
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      dateQuery = {
        timestamp: {
          $gte: monthStart,
          $lt: monthEnd,
        },
      };
    }

    console.log("Date query:", dateQuery);
    console.log("Month start:", new Date(monthFilter + "-01"));
    console.log(
      "Month end:",
      new Date(
        new Date(monthFilter + "-01").getFullYear(),
        new Date(monthFilter + "-01").getMonth() + 1,
        1
      )
    );

    // Get transactions exactly like the API
    const cursor = collection.find(dateQuery).sort({ _id: -1 }).limit(5000);
    const rows = await cursor.toArray();

    console.log(`\n📊 API Results:`);
    console.log(`Total transactions found: ${rows.length}`);

    // Check the first few transactions
    console.log(`\n🔍 First 3 transactions:`);
    rows.slice(0, 3).forEach((t, i) => {
      console.log(`${i + 1}. ID: ${t.id || t._id}`);
      console.log(`   Timestamp: ${t.timestamp}`);
      console.log(`   Date: ${new Date(t.timestamp).toLocaleDateString()}`);
      console.log(`   Items: ${t.items ? t.items.length : 0}`);
      if (t.items && t.items.length > 0) {
        t.items.slice(0, 2).forEach((item) => {
          console.log(
            `   - ${item.name} (Category: "${item.category}") - $${item.price}`
          );
        });
      }
      console.log("");
    });

    // Count transactions by category
    const categoryCount = {};
    let lottoTransactions = 0;
    let lottoTotal = 0;

    rows.forEach((t) => {
      if (t.items && Array.isArray(t.items)) {
        let hasLotto = false;
        t.items.forEach((item) => {
          const category = item.category || "No Category";
          categoryCount[category] = (categoryCount[category] || 0) + 1;

          if (item.category === "Lotto" || item.category === "lotto") {
            hasLotto = true;
          }
        });

        if (hasLotto) {
          lottoTransactions++;
          lottoTotal += t.total || 0;
        }
      }
    });

    console.log(`\n📈 Category breakdown:`);
    Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`  "${cat}": ${count} items`);
      });

    console.log(`\n🎰 Lotto Analysis:`);
    console.log(`Transactions with Lotto items: ${lottoTransactions}`);
    console.log(`Total Lotto revenue: $${lottoTotal.toFixed(2)}`);

    // Test the exact filtering logic from frontend
    console.log(`\n🧪 Testing frontend filtering logic...`);

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

    let frontendLotteryTotal = 0;
    let frontendLotteryTransactionCount = 0;
    let frontendLotteryItemCount = 0;

    // Apply the exact frontend filtering
    rows.forEach((transaction) => {
      let hasLottery = false;
      let lotteryAmountInTransaction = 0;

      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach((item) => {
          let isLotteryItem = false;

          // Check category exactly like frontend
          if (
            item.category &&
            (item.category === "Lotto" || item.category === "lotto")
          ) {
            isLotteryItem = true;
          }

          // Check name keywords
          if (!isLotteryItem && item.name) {
            const itemNameLower = item.name.toLowerCase();
            const foundKeyword = lotteryKeywords.find((keyword) =>
              itemNameLower.includes(keyword)
            );
            if (foundKeyword) {
              isLotteryItem = true;
            }
          }

          if (isLotteryItem) {
            hasLottery = true;
            lotteryAmountInTransaction += item.price * item.quantity;
            frontendLotteryItemCount += item.quantity;
          }
        });
      }

      if (hasLottery) {
        frontendLotteryTotal += lotteryAmountInTransaction;
        frontendLotteryTransactionCount++;
      }
    });

    console.log(`Frontend calculation results:`);
    console.log(`Total Revenue: $${frontendLotteryTotal.toFixed(2)}`);
    console.log(`Transaction Count: ${frontendLotteryTransactionCount}`);
    console.log(`Item Count: ${frontendLotteryItemCount}`);
  } catch (error) {
    console.error("❌ Error debugging frontend data flow:", error);
  } finally {
    await client.close();
    console.log("\n🔒 Database connection closed");
  }
}

// Run the debug
debugFrontendDataFlow();
