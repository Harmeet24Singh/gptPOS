const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function removeLottoWinningsJuly() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const transactionCollection = db.collection("transactions");

    console.log("\n🗑️  Removing Lotto Winnings from July 2025...");

    // Find all July transactions with "Lotto Winnings"
    const lottoWinningsTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
        items: { $elemMatch: { name: "Lotto Winnings" } },
      })
      .toArray();

    console.log(
      `📊 Found ${lottoWinningsTransactions.length} lotto winnings transactions to remove`
    );

    if (lottoWinningsTransactions.length > 0) {
      // Calculate total amount being removed
      const totalWinningsAmount = lottoWinningsTransactions.reduce(
        (sum, t) => sum + t.total,
        0
      );
      console.log(
        `💰 Total winnings amount to remove: $${totalWinningsAmount.toFixed(2)}`
      );

      // Show sample transactions being removed
      console.log(`\n🎰 Sample transactions being removed:`);
      lottoWinningsTransactions.slice(0, 5).forEach((transaction, index) => {
        console.log(
          `   ${index + 1}. ID: ${
            transaction.transactionId
          }, Amount: $${transaction.total.toFixed(2)}`
        );
      });

      // Get transaction IDs to remove
      const transactionIdsToRemove = lottoWinningsTransactions.map(
        (t) => t.transactionId
      );

      console.log(
        `\n🗑️  Removing ${transactionIdsToRemove.length} lotto winnings transactions...`
      );

      // Delete the transactions
      const deleteResult = await transactionCollection.deleteMany({
        transactionId: { $in: transactionIdsToRemove },
      });

      console.log(
        `✅ Successfully removed ${deleteResult.deletedCount} transactions`
      );

      // Verification - check remaining July lottery sales
      const remainingLottery = await transactionCollection
        .aggregate([
          {
            $match: {
              timestamp: {
                $gte: new Date("2025-07-01T00:00:00.000Z"),
                $lt: new Date("2025-08-01T00:00:00.000Z"),
              },
              $or: [
                { items: { $elemMatch: { category: "Lotto" } } },
                { items: { $elemMatch: { category: "Lotto instant" } } },
              ],
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$total" },
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();

      const remainingTotal = remainingLottery[0]?.total || 0;
      const remainingCount = remainingLottery[0]?.count || 0;

      console.log(`\n✅ Final July Lottery Status (after removal):`);
      console.log(`   Remaining lottery sales: $${remainingTotal.toFixed(2)}`);
      console.log(`   Remaining transactions: ${remainingCount}`);
      console.log(`   Original target was: $19,872`);

      // Check if any "Lotto Winnings" transactions remain (should be 0)
      const remainingWinnings = await transactionCollection
        .find({
          timestamp: {
            $gte: new Date("2025-07-01T00:00:00.000Z"),
            $lt: new Date("2025-08-01T00:00:00.000Z"),
          },
          items: { $elemMatch: { name: "Lotto Winnings" } },
        })
        .toArray();

      console.log(`\n🔍 Verification:`);
      console.log(
        `   Remaining "Lotto Winnings" transactions: ${remainingWinnings.length} (should be 0)`
      );

      if (remainingWinnings.length === 0) {
        console.log(
          `✅ All lotto winnings successfully removed from July 2025`
        );
      } else {
        console.log(
          `⚠️  ${remainingWinnings.length} lotto winnings transactions still remain`
        );
      }
    } else {
      console.log(`ℹ️  No lotto winnings transactions found in July 2025`);
    }

    console.log(`\n🎉 Lotto winnings removal complete!`);
  } catch (error) {
    console.error("Error removing lotto winnings:", error);
  } finally {
    await client.close();
  }
}

removeLottoWinningsJuly();
