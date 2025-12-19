const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function adjustJulyAlcoholSales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Get current July alcohol sales
    const julyAlcoholTransactions = await collection.find({
      timestamp: {
        $gte: new Date("2025-07-01T00:00:00.000Z"),
        $lt: new Date("2025-08-01T00:00:00.000Z"),
      },
      "items.category": "Alcohol",
    }).sort({ total: -1 }).toArray(); // Sort by highest value first

    const currentTotal = julyAlcoholTransactions.reduce((sum, t) => sum + t.total, 0);
    const target = 13650;
    const excess = currentTotal - target;

    console.log(`📊 Current July alcohol sales: $${currentTotal.toFixed(2)}`);
    console.log(`🎯 Target: $${target.toFixed(2)}`);
    console.log(`📉 Need to remove: $${excess.toFixed(2)}`);

    if (excess <= 0) {
      console.log("✅ Already at or below target!");
      return;
    }

    // Find transactions to remove (starting with highest value ones)
    let totalToRemove = 0;
    const transactionsToRemove = [];
    
    for (const transaction of julyAlcoholTransactions) {
      if (totalToRemove < excess) {
        transactionsToRemove.push(transaction.transactionId);
        totalToRemove += transaction.total;
        
        if (totalToRemove >= excess) {
          break;
        }
      }
    }

    console.log(`\n🗑️  Will remove ${transactionsToRemove.length} transactions`);
    console.log(`💰 Total value to remove: $${totalToRemove.toFixed(2)}`);
    console.log(`📈 New total will be: $${(currentTotal - totalToRemove).toFixed(2)}`);

    // Ask for confirmation (in a real scenario)
    console.log("\nRemoving transactions...");

    // Remove the selected transactions
    const deleteResult = await collection.deleteMany({
      transactionId: { $in: transactionsToRemove }
    });

    console.log(`✅ Removed ${deleteResult.deletedCount} transactions`);

    // Verify the new total
    const remainingTransactions = await collection.find({
      timestamp: {
        $gte: new Date("2025-07-01T00:00:00.000Z"),
        $lt: new Date("2025-08-01T00:00:00.000Z"),
      },
      "items.category": "Alcohol",
    }).toArray();

    const newTotal = remainingTransactions.reduce((sum, t) => sum + t.total, 0);
    
    console.log(`\n📊 Final July 2025 Alcohol Sales: $${newTotal.toFixed(2)}`);
    console.log(`🎯 Target was: $${target.toFixed(2)}`);
    console.log(`📈 Difference from target: $${(newTotal - target).toFixed(2)}`);
    console.log(`📋 Remaining transactions: ${remainingTransactions.length}`);

  } catch (error) {
    console.error("Error adjusting July alcohol sales:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

// Run the script
adjustJulyAlcoholSales();