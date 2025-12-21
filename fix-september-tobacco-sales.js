const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function fixSeptemberTobaccoSales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const transactionCollection = db.collection("transactions");

    console.log("\n🚬 Fixing September 2025 tobacco sales...");

    // Get current tobacco sales total
    const currentTobacco = await transactionCollection
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date("2025-09-01T00:00:00.000Z"),
              $lt: new Date("2025-10-01T00:00:00.000Z"),
            },
            items: {
              $elemMatch: {
                category: "Tobacco",
              },
            },
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

    const currentTotal = currentTobacco[0]?.total || 0;
    const currentCount = currentTobacco[0]?.count || 0;

    console.log(
      `📊 Current September tobacco sales: ${currentCount} transactions, $${currentTotal.toFixed(
        2
      )}`
    );

    const targetAmount = 5600;
    const excessAmount = currentTotal - targetAmount;

    console.log(
      `🎯 Target: $${targetAmount}, Need to reduce by: $${excessAmount.toFixed(
        2
      )}`
    );

    if (excessAmount <= 0) {
      console.log("✅ Tobacco sales are already at or below target!");
      return;
    }

    // Get tobacco transactions sorted by total amount (largest first for efficiency)
    const tobaccoTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-09-01T00:00:00.000Z"),
          $lt: new Date("2025-10-01T00:00:00.000Z"),
        },
        items: {
          $elemMatch: {
            category: "Tobacco",
          },
        },
      })
      .sort({ total: -1 })
      .toArray();

    console.log(
      `🔄 Found ${tobaccoTransactions.length} tobacco transactions to process...`
    );

    // Remove transactions until we reach target
    let removedAmount = 0;
    let removedCount = 0;
    const transactionsToRemove = [];

    for (const tx of tobaccoTransactions) {
      if (removedAmount >= excessAmount) break;

      transactionsToRemove.push(tx.transactionId);
      removedAmount += tx.total;
      removedCount++;

      console.log(
        `   Will remove transaction ${tx.transactionId}: $${tx.total.toFixed(
          2
        )} (total removed: $${removedAmount.toFixed(2)})`
      );

      // Continue until we've removed enough
      if (removedAmount >= excessAmount) break;
    }

    console.log(
      `\n🗑️  Removing ${removedCount} tobacco transactions, total: $${removedAmount.toFixed(
        2
      )}`
    );

    // Remove the transactions
    if (transactionsToRemove.length > 0) {
      const deleteResult = await transactionCollection.deleteMany({
        transactionId: { $in: transactionsToRemove },
      });
      console.log(
        `✅ Successfully removed ${deleteResult.deletedCount} transactions`
      );
    }

    // Final verification
    const newTobacco = await transactionCollection
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date("2025-09-01T00:00:00.000Z"),
              $lt: new Date("2025-10-01T00:00:00.000Z"),
            },
            items: {
              $elemMatch: {
                category: "Tobacco",
              },
            },
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

    const newTotal = newTobacco[0]?.total || 0;
    const newCount = newTobacco[0]?.count || 0;

    console.log(`\n🎉 Final result:`);
    console.log(`   Tobacco transactions: ${newCount} (was ${currentCount})`);
    console.log(
      `   Tobacco sales: $${newTotal.toFixed(2)} (was $${currentTotal.toFixed(
        2
      )})`
    );
    console.log(`   Target: $${targetAmount}`);
    console.log(
      `   Accuracy: ${((newTotal / targetAmount) * 100).toFixed(1)}%`
    );

    if (Math.abs(newTotal - targetAmount) <= targetAmount * 0.1) {
      console.log(`✅ SUCCESS: Within 10% of target!`);
    } else if (newTotal < targetAmount) {
      console.log(`⚠️  Below target but acceptable`);
    } else {
      console.log(`⚠️  Still above target. Run script again to remove more.`);
    }

    // Show remaining tobacco items breakdown
    const itemBreakdown = await transactionCollection
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date("2025-09-01T00:00:00.000Z"),
              $lt: new Date("2025-10-01T00:00:00.000Z"),
            },
            items: {
              $elemMatch: {
                category: "Tobacco",
              },
            },
          },
        },
        {
          $unwind: "$items",
        },
        {
          $match: {
            "items.category": "Tobacco",
          },
        },
        {
          $group: {
            _id: "$items.name",
            totalSales: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
            totalQuantity: { $sum: "$items.quantity" },
          },
        },
        {
          $sort: { totalSales: -1 },
        },
        {
          $limit: 10,
        },
      ])
      .toArray();

    console.log(`\n🏆 Top tobacco items remaining:`);
    itemBreakdown.forEach((item, index) => {
      console.log(
        `   ${index + 1}. ${item._id}: $${item.totalSales.toFixed(2)} (${
          item.totalQuantity
        } units)`
      );
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

fixSeptemberTobaccoSales();
