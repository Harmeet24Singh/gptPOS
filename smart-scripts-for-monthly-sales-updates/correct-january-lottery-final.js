const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function correctJanuaryLottery() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB);

    console.log("🎲 CORRECTING JANUARY 2026 LOTTERY SALES");
    console.log("=======================================");

    // Get current lottery total
    const currentLottery = await db
      .collection("transactions")
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date(2026, 0, 1),
              $lt: new Date(2026, 1, 1),
            },
            "items.category": "Lottery",
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$total" },
            transactionCount: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const currentTotal = currentLottery[0]?.totalAmount || 0;
    const target = 19000;
    const excess = currentTotal - target;

    console.log(`💰 Current lottery total: $${currentTotal.toFixed(2)}`);
    console.log(`🎯 Target lottery total: $${target.toFixed(2)}`);
    console.log(`📉 Need to remove: $${excess.toFixed(2)}`);

    if (excess <= 0) {
      console.log("✅ Already under target!");
      return;
    }

    // Get lottery transactions sorted by total (highest first)
    const lotteryTransactions = await db
      .collection("transactions")
      .find({
        timestamp: {
          $gte: new Date(2026, 0, 1),
          $lt: new Date(2026, 1, 1),
        },
        "items.category": "Lottery",
      })
      .sort({ total: -1 })
      .toArray();

    console.log(
      `\\n📝 Found ${lotteryTransactions.length} lottery transactions`,
    );

    // Remove transactions until we're under target
    let removedAmount = 0;
    const transactionsToRemove = [];

    for (const transaction of lotteryTransactions) {
      if (removedAmount >= excess * 1.1) break; // Remove 110% of excess to be safe
      transactionsToRemove.push(transaction._id);
      removedAmount += transaction.total;
    }

    console.log(
      `\\n🗑️  Will remove ${transactionsToRemove.length} transactions`,
    );
    console.log(`💰 Total removal amount: $${removedAmount.toFixed(2)}`);
    console.log(
      `🎯 Projected final: $${(currentTotal - removedAmount).toFixed(2)}`,
    );

    if (transactionsToRemove.length > 0) {
      const deleteResult = await db.collection("transactions").deleteMany({
        _id: { $in: transactionsToRemove },
      });

      console.log(`✅ Deleted ${deleteResult.deletedCount} transactions`);

      // Verify final amount
      const finalLottery = await db
        .collection("transactions")
        .aggregate([
          {
            $match: {
              timestamp: {
                $gte: new Date(2026, 0, 1),
                $lt: new Date(2026, 1, 1),
              },
              "items.category": "Lottery",
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$total" },
              transactionCount: { $sum: 1 },
            },
          },
        ])
        .toArray();

      const finalTotal = finalLottery[0]?.totalAmount || 0;
      const finalCount = finalLottery[0]?.transactionCount || 0;

      console.log(`\\n🎉 LOTTERY CORRECTION COMPLETED!`);
      console.log(`💰 Final lottery total: $${finalTotal.toFixed(2)}`);
      console.log(`📝 Final transactions: ${finalCount}`);
      console.log(
        `🎯 Status: ${finalTotal < target ? "✅ Under target" : "⚠️ Still over target"}`,
      );
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

correctJanuaryLottery();
