const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function definitiveLotteryFix() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB);

    console.log("🔍 DEFINITIVE LOTTERY ANALYSIS & FIX");
    console.log("===================================");

    // Method 1: Direct lottery category filter
    const directLotteryQuery = await db
      .collection("transactions")
      .find({
        timestamp: {
          $gte: new Date(2026, 0, 1),
          $lt: new Date(2026, 1, 1),
        },
        "items.category": "Lottery",
      })
      .toArray();

    let directTotal = 0;
    directLotteryQuery.forEach((t) => (directTotal += t.total));

    console.log(`📊 Method 1 - Direct Query:`);
    console.log(`   Transactions: ${directLotteryQuery.length}`);
    console.log(`   Total: $${directTotal.toFixed(2)}`);

    // Method 2: Check transactions without explicit categories (likely lottery)
    const noCategoryQuery = await db
      .collection("transactions")
      .find({
        timestamp: {
          $gte: new Date(2026, 0, 1),
          $lt: new Date(2026, 1, 1),
        },
        "items.category": { $nin: ["Alcohol", "Grocery", "Tobacco"] },
      })
      .toArray();

    let noCategoryTotal = 0;
    noCategoryQuery.forEach((t) => (noCategoryTotal += t.total));

    console.log(`\\n📊 Method 2 - No Category Query (likely lottery):`);
    console.log(`   Transactions: ${noCategoryQuery.length}`);
    console.log(`   Total: $${noCategoryTotal.toFixed(2)}`);

    // Method 3: Get all transactions and manually categorize
    const allTransactions = await db
      .collection("transactions")
      .find({
        timestamp: {
          $gte: new Date(2026, 0, 1),
          $lt: new Date(2026, 1, 1),
        },
      })
      .toArray();

    let alcoholTotal = 0,
      groceryTotal = 0,
      tobaccoTotal = 0,
      lotteryTotal = 0;
    let alcoholCount = 0,
      groceryCount = 0,
      tobaccoCount = 0,
      lotteryCount = 0;

    allTransactions.forEach((t) => {
      let hasAlcohol = false,
        hasGrocery = false,
        hasTobacco = false;

      if (t.items && Array.isArray(t.items)) {
        t.items.forEach((item) => {
          if (item.category === "Alcohol") hasAlcohol = true;
          if (item.category === "Grocery") hasGrocery = true;
          if (item.category === "Tobacco") hasTobacco = true;
        });
      }

      if (hasAlcohol) {
        alcoholTotal += t.total;
        alcoholCount++;
      } else if (hasGrocery) {
        groceryTotal += t.total;
        groceryCount++;
      } else if (hasTobacco) {
        tobaccoTotal += t.total;
        tobaccoCount++;
      } else {
        lotteryTotal += t.total;
        lotteryCount++;
      }
    });

    console.log(`\\n📊 Method 3 - Manual Categorization:`);
    console.log(
      `   🍺 Alcohol: $${alcoholTotal.toFixed(2)} (${alcoholCount} transactions)`,
    );
    console.log(
      `   🛒 Grocery: $${groceryTotal.toFixed(2)} (${groceryCount} transactions)`,
    );
    console.log(
      `   🚬 Tobacco: $${tobaccoTotal.toFixed(2)} (${tobaccoCount} transactions)`,
    );
    console.log(
      `   🎲 Lottery: $${lotteryTotal.toFixed(2)} (${lotteryCount} transactions)`,
    );
    console.log(
      `   📊 Total: $${(alcoholTotal + groceryTotal + tobaccoTotal + lotteryTotal).toFixed(2)}`,
    );

    // If lottery is still over 19000, remove excess
    const target = 18500;
    if (lotteryTotal > target) {
      const excess = lotteryTotal - target;
      console.log(
        `\\n⚠️  Lottery ($${lotteryTotal.toFixed(2)}) is over target ($${target})`,
      );
      console.log(`📉 Need to remove: $${excess.toFixed(2)}`);

      // Get lottery transactions sorted by highest value first
      const lotteryTransactionsToRemove = allTransactions
        .filter((t) => {
          let hasOtherCategory = false;
          if (t.items && Array.isArray(t.items)) {
            t.items.forEach((item) => {
              if (["Alcohol", "Grocery", "Tobacco"].includes(item.category)) {
                hasOtherCategory = true;
              }
            });
          }
          return !hasOtherCategory; // This makes it a lottery transaction
        })
        .sort((a, b) => b.total - a.total); // Highest first

      let removedAmount = 0;
      const idsToRemove = [];

      for (const transaction of lotteryTransactionsToRemove) {
        if (removedAmount >= excess) break;
        idsToRemove.push(transaction._id);
        removedAmount += transaction.total;
      }

      console.log(
        `🗑️  Will remove ${idsToRemove.length} transactions totaling $${removedAmount.toFixed(2)}`,
      );

      if (idsToRemove.length > 0) {
        const deleteResult = await db.collection("transactions").deleteMany({
          _id: { $in: idsToRemove },
        });

        console.log(`✅ Deleted ${deleteResult.deletedCount} transactions`);
        console.log(
          `🎯 New lottery total should be: $${(lotteryTotal - removedAmount).toFixed(2)}`,
        );
      }
    } else {
      console.log(
        `\\n✅ Lottery total ($${lotteryTotal.toFixed(2)}) is already under target ($${target})`,
      );
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

definitiveLotteryFix();
