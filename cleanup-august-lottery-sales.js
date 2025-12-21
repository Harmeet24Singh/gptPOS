const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function cleanupAugustLotterySales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const transactionCollection = db.collection("transactions");

    console.log("\n🧹 Cleaning up August 2025 lottery sales...");

    // Get all August lottery transactions
    const augustLotteryTransactions = await transactionCollection
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

    console.log(
      `📊 Found ${augustLotteryTransactions.length} August lottery transactions`
    );

    // Categorize transactions
    const correctTransactions = [];
    const winningsTransactions = [];
    const scatteredTransactions = [];

    augustLotteryTransactions.forEach((t) => {
      const hasWinnings = t.items.some(
        (item) => item.name === "Lotto Winnings"
      );
      const isInMainRange =
        t.transactionId >= 85000 && t.transactionId <= 87000; // Main generation range

      if (hasWinnings) {
        winningsTransactions.push(t);
      } else if (!isInMainRange) {
        scatteredTransactions.push(t);
      } else {
        correctTransactions.push(t);
      }
    });

    console.log(`\n📈 Transaction Analysis:`);
    console.log(
      `   Correct transactions (85000-87000): ${correctTransactions.length}`
    );
    console.log(`   Winnings transactions: ${winningsTransactions.length}`);
    console.log(`   Scattered transactions: ${scatteredTransactions.length}`);

    const correctTotal = correctTransactions.reduce(
      (sum, t) => sum + t.total,
      0
    );
    const winningsTotal = winningsTransactions.reduce(
      (sum, t) => sum + t.total,
      0
    );
    const scatteredTotal = scatteredTransactions.reduce(
      (sum, t) => sum + t.total,
      0
    );

    console.log(`   Correct total: $${correctTotal.toFixed(2)}`);
    console.log(`   Winnings total: $${winningsTotal.toFixed(2)}`);
    console.log(`   Scattered total: $${scatteredTotal.toFixed(2)}`);

    // Remove winnings and scattered transactions
    const transactionsToRemove = [
      ...winningsTransactions,
      ...scatteredTransactions,
    ];

    if (transactionsToRemove.length > 0) {
      console.log(
        `\n🗑️  Removing ${transactionsToRemove.length} unwanted transactions...`
      );

      const removeIds = transactionsToRemove.map((t) => t.transactionId);
      const removeResult = await transactionCollection.deleteMany({
        transactionId: { $in: removeIds },
      });

      console.log(`✅ Removed ${removeResult.deletedCount} transactions`);
    }

    // Adjust the remaining transactions to hit closer to target
    const targetAmount = 25801; // Lower target as requested in previous message
    console.log(`\n🎯 Adjusting to target: $${targetAmount.toFixed(2)}`);

    if (correctTotal > targetAmount) {
      console.log(
        `Need to remove $${(correctTotal - targetAmount).toFixed(
          2
        )} worth of transactions`
      );

      // Sort by transaction ID (newest first) and remove excess
      correctTransactions.sort((a, b) => b.transactionId - a.transactionId);

      let runningTotal = correctTotal;
      const toRemoveForTarget = [];

      for (const transaction of correctTransactions) {
        if (runningTotal - transaction.total >= targetAmount) {
          toRemoveForTarget.push(transaction);
          runningTotal -= transaction.total;
        } else {
          break;
        }
      }

      if (toRemoveForTarget.length > 0) {
        console.log(
          `🗑️  Removing ${toRemoveForTarget.length} excess transactions to hit target...`
        );

        const excessIds = toRemoveForTarget.map((t) => t.transactionId);
        const excessResult = await transactionCollection.deleteMany({
          transactionId: { $in: excessIds },
        });

        console.log(
          `✅ Removed ${excessResult.deletedCount} excess transactions`
        );
      }
    }

    // Final verification
    const finalAugustLottery = await transactionCollection
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

    const finalTotal = finalAugustLottery.reduce((sum, t) => sum + t.total, 0);
    const finalCount = finalAugustLottery.length;

    console.log(`\n✅ Final August Lottery Results:`);
    console.log(`   Final transactions: ${finalCount}`);
    console.log(`   Final total: $${finalTotal.toFixed(2)}`);
    console.log(`   Target: $${targetAmount.toFixed(2)}`);
    console.log(
      `   Accuracy: ${((finalTotal / targetAmount) * 100).toFixed(1)}%`
    );

    // Check for any remaining winnings
    const remainingWinnings = finalAugustLottery.filter((t) =>
      t.items.some((item) => item.name === "Lotto Winnings")
    );

    if (remainingWinnings.length > 0) {
      console.log(
        `⚠️  ${remainingWinnings.length} winnings transactions still remain`
      );
    } else {
      console.log(`✅ No winnings transactions remaining`);
    }

    console.log(`\n🎉 August lottery cleanup complete!`);
  } catch (error) {
    console.error("Error cleaning up August lottery sales:", error);
  } finally {
    await client.close();
  }
}

cleanupAugustLotterySales();
