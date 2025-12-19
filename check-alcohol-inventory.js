const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function investigateAlcoholInventory() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    
    // Check inventory collection for alcohol items
    const inventoryCollection = db.collection("inventory");
    const alcoholInventory = await inventoryCollection.find({
      category: "Alcohol"
    }).toArray();

    console.log(`\n📦 Current Alcohol Inventory in Database:`);
    console.log(`Total alcohol items: ${alcoholInventory.length}`);
    
    if (alcoholInventory.length > 0) {
      console.log(`\n🍺🍷 Available alcohol items:`);
      alcoholInventory.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name} - $${item.price} (${item.category})`);
        if (item.barcode) console.log(`   Barcode: ${item.barcode}`);
      });
    }

    // Also check what categories exist
    const allCategories = await inventoryCollection.distinct("category");
    console.log(`\n📋 All categories in inventory:`);
    allCategories.forEach(cat => console.log(`- ${cat}`));

    // Check July transactions to see what alcohol items were used
    const transactionCollection = db.collection("transactions");
    const julyTransactions = await transactionCollection.find({
      timestamp: {
        $gte: new Date("2025-07-01T00:00:00.000Z"),
        $lt: new Date("2025-08-01T00:00:00.000Z"),
      },
      "items.category": "Alcohol",
    }).toArray();

    console.log(`\n📊 July Alcohol Transactions Analysis:`);
    console.log(`Total transactions: ${julyTransactions.length}`);

    // Get unique alcohol items used in transactions
    const alcoholItemsUsed = new Set();
    const paymentMethods = {};
    
    julyTransactions.forEach(transaction => {
      // Track payment methods
      const method = transaction.paymentMethod || 'unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
      
      // Track alcohol items
      transaction.items.forEach(item => {
        if (item.category === "Alcohol") {
          alcoholItemsUsed.add(`${item.name} - $${item.price}`);
        }
      });
    });

    console.log(`\n🍺 Alcohol items used in July transactions:`);
    Array.from(alcoholItemsUsed).sort().forEach((item, index) => {
      console.log(`${index + 1}. ${item}`);
    });

    console.log(`\n💳 Payment methods distribution in July:`);
    Object.entries(paymentMethods).forEach(([method, count]) => {
      const percentage = ((count / julyTransactions.length) * 100).toFixed(1);
      console.log(`${method}: ${count} transactions (${percentage}%)`);
    });

  } catch (error) {
    console.error("Error investigating alcohol inventory:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

// Run the script
investigateAlcoholInventory();