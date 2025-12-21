require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function checkGroceryData() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("convenience_store");
    const collection = db.collection("transactions");

    // Get a sample transaction with grocery items
    const sampleGroceryTransaction = await collection.findOne({
      "items.category": "Grocery",
    });

    console.log("\n🔍 Sample grocery transaction structure:");
    if (sampleGroceryTransaction) {
      console.log("Transaction ID:", sampleGroceryTransaction.transactionId);
      console.log("Timestamp:", sampleGroceryTransaction.timestamp);
      console.log("Items sample:", sampleGroceryTransaction.items?.slice(0, 3));
      console.log("Has category field:", !!sampleGroceryTransaction.category);
      console.log(
        "Payment breakdown:",
        sampleGroceryTransaction.paymentBreakdown
      );
    }

    // Check July 2025 specifically
    const julyGroceryCount = await collection.countDocuments({
      timestamp: {
        $gte: new Date("2025-07-01T00:00:00Z"),
        $lt: new Date("2025-08-01T00:00:00Z"),
      },
      "items.category": "Grocery",
    });

    console.log(`\n📊 July 2025 grocery transactions: ${julyGroceryCount}`);

    // Get a few July grocery transactions
    const julyGroceryTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00Z"),
          $lt: new Date("2025-08-01T00:00:00Z"),
        },
        "items.category": "Grocery",
      })
      .limit(3)
      .toArray();

    console.log("\n📅 July grocery transactions sample:");
    julyGroceryTransactions.forEach((t) => {
      console.log(
        `- ${t.transactionId}: ${t.timestamp}, Total: $${t.total}, Items: ${t.items.length}`
      );
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

checkGroceryData();
