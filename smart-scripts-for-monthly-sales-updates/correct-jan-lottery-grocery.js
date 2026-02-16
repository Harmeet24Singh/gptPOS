const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function correctJanuaryLotteryAndGrocery() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB);

    console.log("🛠️  CORRECTING JANUARY 2026 LOTTERY & GROCERY");
    console.log("==============================================");

    // Check current lottery sales
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

    // Check current grocery sales
    const currentGrocery = await db
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
            "items.category": "Grocery",
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

    const lotteryTotal = currentLottery[0]?.totalAmount || 0;
    const lotteryCount = currentLottery[0]?.transactionCount || 0;
    const groceryTotal = currentGrocery[0]?.totalAmount || 0;
    const groceryCount = currentGrocery[0]?.transactionCount || 0;

    const lotteryTarget = 19000;
    const groceryTarget = 6000;

    console.log("\\n📊 CURRENT STATUS:");
    console.log(
      `🎲 Lottery: $${lotteryTotal.toFixed(2)} (${lotteryCount} transactions)`,
    );
    console.log(
      `🛒 Grocery: $${groceryTotal.toFixed(2)} (${groceryCount} transactions)`,
    );
    console.log("\\n🎯 TARGETS:");
    console.log(`🎲 Lottery: Under $${lotteryTarget.toFixed(2)}`);
    console.log(`🛒 Grocery: Near $${groceryTarget.toFixed(2)}`);

    // === LOTTERY CORRECTION ===
    if (lotteryTotal > lotteryTarget) {
      const lotteryExcess = lotteryTotal - lotteryTarget + 200; // Extra buffer to stay under
      console.log(
        `\\n🎲 CORRECTING LOTTERY - Need to remove $${lotteryExcess.toFixed(2)}`,
      );

      // Get lottery transactions ordered by amount (largest first)
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

      let lotteryToDelete = [];
      let lotteryDeletedAmount = 0;

      for (const transaction of lotteryTransactions) {
        if (lotteryDeletedAmount >= lotteryExcess) break;
        lotteryToDelete.push(transaction._id);
        lotteryDeletedAmount += transaction.total;
      }

      console.log(
        `   🗑️  Deleting ${lotteryToDelete.length} lottery transactions ($${lotteryDeletedAmount.toFixed(2)})`,
      );

      const lotteryDeleteResult = await db
        .collection("transactions")
        .deleteMany({
          _id: { $in: lotteryToDelete },
        });

      console.log(
        `   ✅ Deleted ${lotteryDeleteResult.deletedCount} lottery transactions`,
      );
    } else {
      console.log(`\\n🎲 LOTTERY OK - Already under target`);
    }

    // === GROCERY CORRECTION ===
    const groceryDifference = groceryTotal - groceryTarget;

    if (Math.abs(groceryDifference) > 200) {
      // Only correct if difference is significant
      if (groceryDifference > 0) {
        // Too much grocery - remove some
        console.log(
          `\\n🛒 CORRECTING GROCERY - Need to remove $${groceryDifference.toFixed(2)}`,
        );

        const groceryTransactions = await db
          .collection("transactions")
          .find({
            timestamp: {
              $gte: new Date(2026, 0, 1),
              $lt: new Date(2026, 1, 1),
            },
            "items.category": "Grocery",
          })
          .sort({ total: -1 })
          .toArray();

        let groceryToDelete = [];
        let groceryDeletedAmount = 0;

        for (const transaction of groceryTransactions) {
          if (groceryDeletedAmount >= groceryDifference) break;
          groceryToDelete.push(transaction._id);
          groceryDeletedAmount += transaction.total;
        }

        console.log(
          `   🗑️  Deleting ${groceryToDelete.length} grocery transactions ($${groceryDeletedAmount.toFixed(2)})`,
        );

        const groceryDeleteResult = await db
          .collection("transactions")
          .deleteMany({
            _id: { $in: groceryToDelete },
          });

        console.log(
          `   ✅ Deleted ${groceryDeleteResult.deletedCount} grocery transactions`,
        );
      } else {
        // Not enough grocery - add some
        console.log(
          `\\n🛒 GROCERY NEEDS INCREASE - Need to add $${Math.abs(groceryDifference).toFixed(2)}`,
        );
        console.log(
          "   ℹ️  Use the generate-monthly-sales.js script to add grocery transactions",
        );
      }
    } else {
      console.log(`\\n🛒 GROCERY OK - Close enough to target`);
    }

    // === FINAL VERIFICATION ===
    console.log("\\n🔍 VERIFYING FINAL RESULTS...");

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

    const finalGrocery = await db
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
            "items.category": "Grocery",
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

    const finalLotteryTotal = finalLottery[0]?.totalAmount || 0;
    const finalLotteryCount = finalLottery[0]?.transactionCount || 0;
    const finalGroceryTotal = finalGrocery[0]?.totalAmount || 0;
    const finalGroceryCount = finalGrocery[0]?.transactionCount || 0;

    console.log("\\n🎉 CORRECTION COMPLETED!");
    console.log("==========================");
    console.log(
      `🎲 Final lottery: $${finalLotteryTotal.toFixed(2)} (${finalLotteryCount} transactions)`,
    );
    console.log(
      `   Status: ${finalLotteryTotal < lotteryTarget ? "✅ Under target" : "❌ Still over target"}`,
    );
    console.log(
      `🛒 Final grocery: $${finalGroceryTotal.toFixed(2)} (${finalGroceryCount} transactions)`,
    );
    console.log(
      `   Status: ${Math.abs(finalGroceryTotal - groceryTarget) < 500 ? "✅ Near target" : "⚠️  Needs adjustment"}`,
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

correctJanuaryLotteryAndGrocery();
