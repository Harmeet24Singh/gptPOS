require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function debugJulyGrocery() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("pos");
    const collection = db.collection("transactions");

    // Check all transactions in July 2025
    console.log("🔍 Checking July 2025 transactions...\n");

    const julyTransactions = await collection
      .find({
        $or: [
          { date: { $regex: "^2025-07" } },
          {
            date: {
              $gte: "2025-07-01",
              $lte: "2025-07-31",
            },
          },
        ],
      })
      .limit(5)
      .toArray();

    console.log(
      `Found ${julyTransactions.length} July transactions (showing first 5):`
    );
    julyTransactions.forEach((t) => {
      console.log(
        `- ID: ${t.transactionId}, Date: ${t.date}, Category: ${t.category}, Total: $${t.total}`
      );
    });

    // Check specifically for grocery category
    const groceryCount = await collection.countDocuments({
      category: "grocery",
      date: { $regex: "^2025-07" },
    });

    console.log(`\n🛒 Grocery transactions in July 2025: ${groceryCount}`);

    // Check date formats
    const sampleTransactions = await collection
      .find({
        category: "grocery",
      })
      .limit(3)
      .toArray();

    console.log("\n📅 Sample grocery transaction dates:");
    sampleTransactions.forEach((t) => {
      console.log(`- ${t.transactionId}: ${t.date} (${typeof t.date})`);
    });
  } catch (error) {
    console.error("❌ Debug error:", error);
  } finally {
    await client.close();
  }
}

debugJulyGrocery();
