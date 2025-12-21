const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function checkJulyLotterySales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const transactionCollection = db.collection("transactions");

    console.log("\n🔍 Checking July 2025 Lottery Sales...");

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
      `📊 Total July lottery transactions found: ${julyLotteryTransactions.length}`
    );

    // Calculate total
    const totalLotterySales = julyLotteryTransactions.reduce(
      (sum, t) => sum + t.total,
      0
    );
    console.log(
      `💰 Total July lottery sales: $${totalLotterySales.toFixed(2)}`
    );
    console.log(`🎯 Target was: $19,872.00`);
    console.log(`📈 Difference: $${(totalLotterySales - 19872).toFixed(2)}`);

    // Analyze transaction ID ranges to identify different generation batches
    console.log(`\n🆔 Transaction ID Analysis:`);

    const transactionRanges = {};
    julyLotteryTransactions.forEach((t) => {
      const rangeStart = Math.floor(t.transactionId / 1000) * 1000;
      const rangeKey = `${rangeStart}-${rangeStart + 999}`;

      if (!transactionRanges[rangeKey]) {
        transactionRanges[rangeKey] = [];
      }
      transactionRanges[rangeKey].push(t);
    });

    Object.entries(transactionRanges).forEach(([range, transactions]) => {
      const total = transactions.reduce((sum, t) => sum + t.total, 0);
      const minId = Math.min(...transactions.map((t) => t.transactionId));
      const maxId = Math.max(...transactions.map((t) => t.transactionId));

      console.log(
        `   Range ${range}: ${
          transactions.length
        } transactions ($${total.toFixed(2)}) [${minId}-${maxId}]`
      );
    });

    // Analyze by creation patterns to identify duplicates
    console.log(`\n📅 Generation Pattern Analysis:`);

    // Group by similar patterns in item names
    const generationBatches = {};

    julyLotteryTransactions.forEach((t) => {
      // Create a signature based on transaction characteristics
      const hasActualItems = t.items.some(
        (item) =>
          item.name === "Crossword" ||
          item.name === "Plinko" ||
          item.name === "The Big Spin" ||
          item.name.startsWith("Lotto $")
      );

      const hasFakeItems = t.items.some(
        (item) =>
          item.name === "Lotto Winnings" ||
          item.name === "Monopoly" ||
          item.name === "Lucky 7s" ||
          item.name === "Wheel of Fortune"
      );

      let batchType = "Unknown";
      if (hasActualItems && !hasFakeItems) {
        batchType = "Correct_Items";
      } else if (hasFakeItems) {
        batchType = "Fake_Items";
      } else {
        batchType = "Mixed_Items";
      }

      if (!generationBatches[batchType]) {
        generationBatches[batchType] = [];
      }
      generationBatches[batchType].push(t);
    });

    Object.entries(generationBatches).forEach(([batchType, transactions]) => {
      const total = transactions.reduce((sum, t) => sum + t.total, 0);
      console.log(
        `   ${batchType}: ${transactions.length} transactions ($${total.toFixed(
          2
        )})`
      );

      // Show sample items from this batch
      if (transactions.length > 0) {
        const sampleItems = transactions[0].items.map((item) => item.name);
        console.log(`     Sample items: ${sampleItems.join(", ")}`);
      }
    });

    console.log(`\n🔧 Suggested Action:`);
    console.log(
      `Since we have $${totalLotterySales.toFixed(
        2
      )} instead of target $19,872:`
    );
    console.log(
      `1. Keep only the "Correct_Items" batch (uses actual database items)`
    );
    console.log(`2. Remove the duplicate/fake item batches`);
    console.log(`3. This should bring us back to the target amount`);

    // Show which transactions to potentially remove
    const correctBatch = generationBatches["Correct_Items"] || [];
    const correctTotal = correctBatch.reduce((sum, t) => sum + t.total, 0);

    if (correctBatch.length > 0) {
      console.log(`\n✅ Correct batch details:`);
      console.log(`   Transactions: ${correctBatch.length}`);
      console.log(`   Total: $${correctTotal.toFixed(2)}`);
      console.log(
        `   Transaction ID range: ${Math.min(
          ...correctBatch.map((t) => t.transactionId)
        )} - ${Math.max(...correctBatch.map((t) => t.transactionId))}`
      );
    }
  } catch (error) {
    console.error("Error checking July lottery sales:", error);
  } finally {
    await client.close();
  }
}

checkJulyLotterySales();
