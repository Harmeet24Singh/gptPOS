const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function correctJanuaryLottery() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB);

    console.log("🎲 CORRECTING JANUARY 2026 LOTTERY SALES");
    console.log("=========================================");

    // First, get current lottery sales
    const currentLottery = await db
      .collection("transactions")
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date(2026, 0, 1),
              $lt: new Date(2026, 1, 1),
            },
          },
        },
        {
          $match: {
            "items.category": { $in: ["Lottery", "Lotto"] },
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
    const currentCount = currentLottery[0]?.transactionCount || 0;
    const targetAmount = 19000;
    const excessAmount = currentTotal - targetAmount;

    console.log(`💰 Current lottery total: $${currentTotal.toFixed(2)}`);
    console.log(`🎯 Target lottery total: $${targetAmount.toFixed(2)}`);
    console.log(`❌ Excess amount: $${excessAmount.toFixed(2)}`);
    console.log(`📝 Current transactions: ${currentCount}`);

    if (excessAmount <= 0) {
      console.log("✅ No correction needed - already at or below target!");
      return;
    }

    // Get lottery transactions ordered by amount (largest first to remove efficiently)
    const lotteryTransactions = await db
      .collection("transactions")
      .find({
        timestamp: {
          $gte: new Date(2026, 0, 1),
          $lt: new Date(2026, 1, 1),
        },
        "items.category": { $in: ["Lottery", "Lotto"] },
      })
      .sort({ total: -1 })
      .toArray();

    let toDelete = [];
    let deletedAmount = 0;

    // Select transactions to delete to get close to target
    for (const transaction of lotteryTransactions) {
      if (deletedAmount >= excessAmount) break;

      toDelete.push(transaction._id);
      deletedAmount += transaction.total;

      if (
        toDelete.length >=
        Math.ceil(excessAmount / (currentTotal / currentCount))
      ) {
        break;
      }
    }

    console.log(`\n🗑️  Planning to delete ${toDelete.length} transactions`);
    console.log(`💰 Total amount to remove: $${deletedAmount.toFixed(2)}`);
    console.log(
      `🎯 Final amount will be: $${(currentTotal - deletedAmount).toFixed(2)}`,
    );

    // Delete the selected transactions
    const deleteResult = await db.collection("transactions").deleteMany({
      _id: { $in: toDelete },
    });

    console.log(
      `\n✅ Deleted ${deleteResult.deletedCount} lottery transactions`,
    );

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
          },
        },
        {
          $match: {
            "items.category": { $in: ["Lottery", "Lotto"] },
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

    console.log(`\n🎉 CORRECTION COMPLETED!`);
    console.log(`💰 Final lottery total: $${finalTotal.toFixed(2)}`);
    console.log(`📝 Final transactions: ${finalCount}`);
    console.log(
      `🎯 Target achievement: ${((finalTotal / targetAmount) * 100).toFixed(1)}%`,
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

correctJanuaryLottery();
