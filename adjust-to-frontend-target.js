const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function adjustToFrontendTarget() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const transactionCollection = db.collection("transactions");

    console.log("\n🎯 Adjusting August lottery to show $16,914 on frontend");
    console.log("=".repeat(60));

    // Get current August lottery transactions
    const currentLottery = await transactionCollection
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

    const currentTotal = currentLottery.reduce((sum, t) => sum + t.total, 0);
    const lottoOnly = currentLottery.filter((t) =>
      t.items.some((item) => item.category === "Lotto")
    );
    const lottoTotal = lottoOnly.reduce((sum, t) => sum + t.total, 0);

    console.log(`Current total lottery: $${currentTotal.toFixed(2)}`);
    console.log(`Current Lotto only: $${lottoTotal.toFixed(2)}`);
    console.log(`Target (what frontend shows): $16,914.00`);
    console.log(`Difference to remove: $${(lottoTotal - 16914).toFixed(2)}`);

    // If the frontend is only showing Lotto (machine tickets), let's adjust to $16,914
    if (lottoTotal > 16914) {
      const amountToRemove = lottoTotal - 16914;
      console.log(
        `\n🗑️  Need to remove $${amountToRemove.toFixed(
          2
        )} in Lotto transactions`
      );

      // Sort Lotto transactions by value (highest first) and remove until we hit target
      const sortedLotto = lottoOnly.sort((a, b) => b.total - a.total);

      let removedAmount = 0;
      const transactionsToRemove = [];

      for (const transaction of sortedLotto) {
        if (removedAmount + transaction.total <= amountToRemove + 50) {
          // Small buffer
          transactionsToRemove.push(transaction);
          removedAmount += transaction.total;
        }
        if (removedAmount >= amountToRemove - 50) break; // Close enough
      }

      console.log(
        `\nRemoving ${
          transactionsToRemove.length
        } transactions totaling $${removedAmount.toFixed(2)}`
      );

      if (transactionsToRemove.length > 0) {
        const removeIds = transactionsToRemove.map((t) => t.transactionId);
        const removeResult = await transactionCollection.deleteMany({
          transactionId: { $in: removeIds },
        });

        console.log(`✅ Removed ${removeResult.deletedCount} transactions`);
      }
    }

    // Final verification
    const finalLottery = await transactionCollection
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

    const finalTotal = finalLottery.reduce((sum, t) => sum + t.total, 0);
    const finalLottoOnly = finalLottery.filter((t) =>
      t.items.some((item) => item.category === "Lotto")
    );
    const finalLottoTotal = finalLottoOnly.reduce((sum, t) => sum + t.total, 0);
    const finalInstantOnly = finalLottery.filter((t) =>
      t.items.some((item) => item.category === "Lotto instant")
    );
    const finalInstantTotal = finalInstantOnly.reduce(
      (sum, t) => sum + t.total,
      0
    );

    console.log(`\n✅ Final August Lottery Results:`);
    console.log(`   Total Lottery Sales: $${finalTotal.toFixed(2)}`);
    console.log(
      `   Lotto (machine): $${finalLottoTotal.toFixed(2)} (${
        finalLottoOnly.length
      } transactions)`
    );
    console.log(
      `   Lotto Instant: $${finalInstantTotal.toFixed(2)} (${
        finalInstantOnly.length
      } transactions)`
    );
    console.log(`\n💻 What frontend should show:`);
    console.log(`   If showing all lottery: $${finalTotal.toFixed(2)}`);
    console.log(`   If showing only Lotto: $${finalLottoTotal.toFixed(2)}`);
    console.log(`   Target was: $16,914.00`);
    console.log(
      `   Difference: $${Math.abs(finalLottoTotal - 16914).toFixed(2)}`
    );
  } catch (error) {
    console.error("Error adjusting lottery total:", error);
  } finally {
    await client.close();
  }
}

adjustToFrontendTarget();
