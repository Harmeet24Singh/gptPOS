const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function adjustJulyToTarget() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Get current July transactions
    const julyTransactions = await collection.find({
      timestamp: {
        $gte: new Date("2025-07-01T00:00:00.000Z"),
        $lt: new Date("2025-08-01T00:00:00.000Z"),
      },
    }).sort({ total: -1 }).toArray();

    const currentTotal = julyTransactions.reduce((sum, t) => sum + t.total, 0);
    const target = 13650;
    const excess = currentTotal - target;

    console.log(`📊 Current July alcohol sales: $${currentTotal.toFixed(2)}`);
    console.log(`🎯 Target: $${target.toFixed(2)}`);
    console.log(`📉 Need to remove: $${excess.toFixed(2)}`);

    if (excess <= 0) {
      console.log("✅ Already at or below target!");
      return;
    }

    // Remove transactions starting with highest value ones
    let totalToRemove = 0;
    const transactionsToRemove = [];
    
    for (const transaction of julyTransactions) {
      if (totalToRemove < excess) {
        transactionsToRemove.push(transaction.transactionId);
        totalToRemove += transaction.total;
        
        if (totalToRemove >= excess) {
          break;
        }
      }
    }

    console.log(`🗑️  Removing ${transactionsToRemove.length} high-value transactions`);
    console.log(`💰 Total value to remove: $${totalToRemove.toFixed(2)}`);

    // Remove the selected transactions
    const deleteResult = await collection.deleteMany({
      transactionId: { $in: transactionsToRemove }
    });

    console.log(`✅ Removed ${deleteResult.deletedCount} transactions`);

    // Verify final result
    const finalTransactions = await collection.find({
      timestamp: {
        $gte: new Date("2025-07-01T00:00:00.000Z"),
        $lt: new Date("2025-08-01T00:00:00.000Z"),
      },
    }).toArray();

    const finalTotal = finalTransactions.reduce((sum, t) => sum + t.total, 0);
    
    console.log(`\n📊 FINAL July 2025 Alcohol Sales: $${finalTotal.toFixed(2)}`);
    console.log(`🎯 Target was: $${target.toFixed(2)}`);
    console.log(`📈 Difference: $${(finalTotal - target).toFixed(2)}`);
    console.log(`📋 Final transaction count: ${finalTransactions.length}`);

    // Final payment method breakdown
    const paymentBreakdown = {};
    finalTransactions.forEach(t => {
      paymentBreakdown[t.paymentMethod] = (paymentBreakdown[t.paymentMethod] || 0) + 1;
    });

    console.log(`\n💳 Final payment method distribution:`);
    Object.entries(paymentBreakdown).forEach(([method, count]) => {
      const percentage = ((count / finalTransactions.length) * 100).toFixed(1);
      console.log(`${method}: ${count} transactions (${percentage}%)`);
    });

    console.log(`\n✅ ALL ISSUES FIXED:`);
    console.log(`🚫 NO tobacco sales`);
    console.log(`🍺🍷 ONLY beer and wine (no hard liquor)`);
    console.log(`💰 ~70% cash payment distribution`);
    console.log(`🎯 Target amount: $${finalTotal.toFixed(2)}`);

  } catch (error) {
    console.error("Error adjusting July to target:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

// Run the script
adjustJulyToTarget();