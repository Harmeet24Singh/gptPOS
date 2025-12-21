const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function debugFrontendAugustLottery() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const transactionCollection = db.collection("transactions");

    console.log("\n🔍 Debugging Frontend August Lottery Calculation");
    console.log("=".repeat(60));

    // Check different possible queries that frontend might be using
    const queries = [
      {
        name: "All August Lottery (Lotto + Lotto instant)",
        query: {
          timestamp: {
            $gte: new Date("2025-08-01T00:00:00.000Z"),
            $lt: new Date("2025-09-01T00:00:00.000Z"),
          },
          $or: [
            { items: { $elemMatch: { category: "Lotto" } } },
            { items: { $elemMatch: { category: "Lotto instant" } } },
          ],
        },
      },
      {
        name: "Only Lotto category",
        query: {
          timestamp: {
            $gte: new Date("2025-08-01T00:00:00.000Z"),
            $lt: new Date("2025-09-01T00:00:00.000Z"),
          },
          items: { $elemMatch: { category: "Lotto" } },
        },
      },
      {
        name: "Only Lotto instant category",
        query: {
          timestamp: {
            $gte: new Date("2025-08-01T00:00:00.000Z"),
            $lt: new Date("2025-09-01T00:00:00.000Z"),
          },
          items: { $elemMatch: { category: "Lotto instant" } },
        },
      },
      {
        name: "Items containing 'Lotto' in name",
        query: {
          timestamp: {
            $gte: new Date("2025-08-01T00:00:00.000Z"),
            $lt: new Date("2025-09-01T00:00:00.000Z"),
          },
          items: { $elemMatch: { name: { $regex: /lotto/i } } },
        },
      },
      {
        name: "Lottery transactions (common frontend filter)",
        query: {
          timestamp: {
            $gte: new Date("2025-08-01T00:00:00.000Z"),
            $lt: new Date("2025-09-01T00:00:00.000Z"),
          },
          $or: [
            { items: { $elemMatch: { category: { $regex: /lotto/i } } } },
            { items: { $elemMatch: { name: { $regex: /lottery|lotto/i } } } },
          ],
        },
      },
    ];

    for (const queryTest of queries) {
      console.log(`\n📊 Testing: ${queryTest.name}`);
      console.log("-".repeat(40));

      const transactions = await transactionCollection
        .find(queryTest.query)
        .toArray();
      const total = transactions.reduce((sum, t) => sum + t.total, 0);

      console.log(`   Transactions: ${transactions.length}`);
      console.log(`   Total: $${total.toFixed(2)}`);

      // Check if this matches the $16,914 the user is seeing
      if (Math.abs(total - 16914) < 1) {
        console.log(`   🎯 MATCH! This query gives $16,914!`);
      }
    }

    // Let's specifically check what gives us $16,914
    console.log(`\n🎯 Looking for transactions that sum to ~$16,914...`);

    // Check if it's just the Lotto category
    const lottoOnly = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-08-01T00:00:00.000Z"),
          $lt: new Date("2025-09-01T00:00:00.000Z"),
        },
        items: { $elemMatch: { category: "Lotto" } },
      })
      .toArray();

    const lottoTotal = lottoOnly.reduce((sum, t) => sum + t.total, 0);
    console.log(`Lotto only total: $${lottoTotal.toFixed(2)}`);

    // Check if frontend is calculating item totals differently
    let itemBasedTotal = 0;
    const allAugustLottery = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-08-01T00:00:00.000Z"),
          $lt: new Date("2025-09-01T00:00:00.000Z"),
        },
        $or: [
          { items: { $elemMatch: { category: "Lotto" } } },
          { items: { $elemMatch: { category: "Lotto instant" } } },
        ],
      })
      .toArray();

    allAugustLottery.forEach((transaction) => {
      transaction.items.forEach((item) => {
        if (item.category === "Lotto" || item.category === "Lotto instant") {
          itemBasedTotal += item.price;
        }
      });
    });

    console.log(`Item-based calculation: $${itemBasedTotal.toFixed(2)}`);
    console.log(
      `Transaction total calculation: $${allAugustLottery
        .reduce((sum, t) => sum + t.total, 0)
        .toFixed(2)}`
    );

    // Check for any transactions that might have mixed items
    const mixedTransactions = allAugustLottery.filter((t) => {
      const lotteryItems = t.items.filter(
        (item) => item.category === "Lotto" || item.category === "Lotto instant"
      );
      return lotteryItems.length !== t.items.length;
    });

    if (mixedTransactions.length > 0) {
      console.log(
        `\n⚠️  Found ${mixedTransactions.length} mixed transactions (lottery + non-lottery items)`
      );
      console.log(`This might cause frontend calculation differences!`);

      let mixedTotal = 0;
      mixedTransactions.forEach((t) => {
        const lotteryItemsTotal = t.items
          .filter(
            (item) =>
              item.category === "Lotto" || item.category === "Lotto instant"
          )
          .reduce((sum, item) => sum + item.price, 0);
        mixedTotal += lotteryItemsTotal;

        if (mixedTransactions.length <= 5) {
          // Show details for first few
          console.log(
            `   ID ${t.transactionId}: Total $${t.total}, Lottery items: $${lotteryItemsTotal}`
          );
        }
      });
      console.log(
        `Mixed transactions lottery items total: $${mixedTotal.toFixed(2)}`
      );
    }
  } catch (error) {
    console.error("Error debugging frontend calculation:", error);
  } finally {
    await client.close();
  }
}

debugFrontendAugustLottery();
