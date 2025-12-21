const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function cleanupJulyLotterySales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const transactionCollection = db.collection("transactions");

    console.log(
      "\n🧹 Cleaning up July 2025 lottery sales to target $19,872..."
    );

    // Get all July lottery transactions
    const julyLotteryTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
        $or: [
          { items: { $elemMatch: { category: "Lotto" } } },
          { items: { $elemMatch: { category: "Lotto instant" } } },
        ],
      })
      .sort({ transactionId: 1 })
      .toArray();

    console.log(
      `📊 Current lottery transactions: ${julyLotteryTransactions.length}`
    );
    const currentTotal = julyLotteryTransactions.reduce(
      (sum, t) => sum + t.total,
      0
    );
    console.log(`💰 Current total: $${currentTotal.toFixed(2)}`);

    // Categorize transactions
    const correctTransactions = [];
    const fakeTransactions = [];
    const mixedTransactions = [];

    julyLotteryTransactions.forEach((t) => {
      const hasActualItems = t.items.some(
        (item) =>
          item.name === "Crossword" ||
          item.name === "Plinko" ||
          item.name === "The Big Spin" ||
          item.name === "The Bigger Spin" ||
          item.name === "Diamond" ||
          item.name === "Extreme" ||
          item.name === "Frenzy" ||
          item.name === "Candy Cane" ||
          (item.name.startsWith("Lotto $") && !item.name.includes("Winnings"))
      );

      const hasFakeItems = t.items.some(
        (item) =>
          item.name === "Lotto Winnings" ||
          item.name === "Monopoly" ||
          item.name === "Lucky 7s" ||
          item.name === "Wheel of Fortune" ||
          item.name === "Big Play" ||
          item.name === "Cash Blast"
      );

      if (hasActualItems && !hasFakeItems) {
        correctTransactions.push(t);
      } else if (hasFakeItems) {
        fakeTransactions.push(t);
      } else {
        mixedTransactions.push(t);
      }
    });

    console.log(`\n📈 Transaction Analysis:`);
    console.log(
      `   Correct (actual DB items): ${
        correctTransactions.length
      } transactions ($${correctTransactions
        .reduce((sum, t) => sum + t.total, 0)
        .toFixed(2)})`
    );
    console.log(
      `   Fake items: ${
        fakeTransactions.length
      } transactions ($${fakeTransactions
        .reduce((sum, t) => sum + t.total, 0)
        .toFixed(2)})`
    );
    console.log(
      `   Mixed/Other: ${
        mixedTransactions.length
      } transactions ($${mixedTransactions
        .reduce((sum, t) => sum + t.total, 0)
        .toFixed(2)})`
    );

    // Step 1: Remove fake and mixed transactions
    const transactionsToRemove = [...fakeTransactions, ...mixedTransactions];

    if (transactionsToRemove.length > 0) {
      console.log(
        `\n🗑️  Removing ${transactionsToRemove.length} incorrect lottery transactions...`
      );

      const removeIds = transactionsToRemove.map((t) => t.transactionId);
      const removeResult = await transactionCollection.deleteMany({
        transactionId: { $in: removeIds },
      });

      console.log(`✅ Removed ${removeResult.deletedCount} transactions`);
    }

    // Step 2: Check remaining total and adjust if needed
    const remainingTotal = correctTransactions.reduce(
      (sum, t) => sum + t.total,
      0
    );
    const targetAmount = 19872;

    console.log(`\n📊 After cleanup:`);
    console.log(`   Remaining transactions: ${correctTransactions.length}`);
    console.log(`   Remaining total: $${remainingTotal.toFixed(2)}`);
    console.log(`   Target: $${targetAmount.toFixed(2)}`);
    console.log(
      `   Difference: $${(remainingTotal - targetAmount).toFixed(2)}`
    );

    // If still over target, remove some transactions from the end
    if (remainingTotal > targetAmount) {
      console.log(
        `\n🎯 Still over target by $${(remainingTotal - targetAmount).toFixed(
          2
        )}`
      );
      console.log(`📉 Removing excess transactions to reach target...`);

      // Sort by transaction ID (newest first) and remove until we hit target
      correctTransactions.sort((a, b) => b.transactionId - a.transactionId);

      let runningTotal = remainingTotal;
      const transactionsToRemoveForTarget = [];

      for (const transaction of correctTransactions) {
        if (runningTotal - transaction.total >= targetAmount) {
          transactionsToRemoveForTarget.push(transaction);
          runningTotal -= transaction.total;
        } else {
          break;
        }
      }

      if (transactionsToRemoveForTarget.length > 0) {
        console.log(
          `🗑️  Removing ${transactionsToRemoveForTarget.length} excess transactions...`
        );

        const excessIds = transactionsToRemoveForTarget.map(
          (t) => t.transactionId
        );
        const excessResult = await transactionCollection.deleteMany({
          transactionId: { $in: excessIds },
        });

        console.log(
          `✅ Removed ${excessResult.deletedCount} excess transactions`
        );
      }
    }

    // Final verification
    console.log(`\n✅ Final Verification:`);

    const finalLotteryTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
        $or: [
          { items: { $elemMatch: { category: "Lotto" } } },
          { items: { $elemMatch: { category: "Lotto instant" } } },
        ],
      })
      .toArray();

    const finalTotal = finalLotteryTransactions.reduce(
      (sum, t) => sum + t.total,
      0
    );
    const finalCount = finalLotteryTransactions.length;

    console.log(`   Final lottery transactions: ${finalCount}`);
    console.log(`   Final lottery total: $${finalTotal.toFixed(2)}`);
    console.log(`   Target: $${targetAmount.toFixed(2)}`);
    console.log(
      `   Accuracy: ${((finalTotal / targetAmount) * 100).toFixed(1)}%`
    );

    // Check card limit compliance
    const finalCardCheck = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
        paymentMethod: "card",
      })
      .toArray();

    const finalCardTotal = finalCardCheck.reduce((sum, t) => sum + t.total, 0);
    console.log(`\n💳 Card Usage Check:`);
    console.log(
      `   Total July card transactions: $${finalCardTotal.toFixed(2)}`
    );
    console.log(`   Card limit: $15,000.00`);
    console.log(
      `   Status: ${
        finalCardTotal > 15000 ? "❌ OVER LIMIT" : "✅ Under limit"
      }`
    );

    console.log(`\n🎉 July lottery sales cleanup complete!`);
  } catch (error) {
    console.error("Error cleaning up July lottery sales:", error);
  } finally {
    await client.close();
  }
}

cleanupJulyLotterySales();
