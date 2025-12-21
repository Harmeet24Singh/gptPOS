const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function checkAndAddLotteryItems() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const itemCollection = db.collection("items");

    console.log("\n🔍 Checking lottery items in database...");

    // Check all items that might be lottery-related
    const allItems = await itemCollection.find({}).toArray();
    console.log(`Total items in database: ${allItems.length}`);

    // Look for lottery items by category or name
    const lotteryItems = allItems.filter(
      (item) =>
        item.category?.toLowerCase().includes("lott") ||
        item.name?.toLowerCase().includes("lott")
    );

    console.log(`\nLottery-related items found: ${lotteryItems.length}`);
    lotteryItems.forEach((item) => {
      console.log(`   - ${item.name} (${item.category}) - $${item.price}`);
    });

    // If no lottery items, let's add them
    if (lotteryItems.length === 0) {
      console.log("\n➕ No lottery items found. Adding lottery items...");

      const lotteryItemsToAdd = [
        // Lotto machine items (different denominations)
        {
          name: "Lotto $1.00",
          category: "Lotto",
          price: 1.0,
          barcode: "LOTTO1",
          taxRate: 0,
        },
        {
          name: "Lotto $2.00",
          category: "Lotto",
          price: 2.0,
          barcode: "LOTTO2",
          taxRate: 0,
        },
        {
          name: "Lotto $3.00",
          category: "Lotto",
          price: 3.0,
          barcode: "LOTTO3",
          taxRate: 0,
        },
        {
          name: "Lotto $5.00",
          category: "Lotto",
          price: 5.0,
          barcode: "LOTTO5",
          taxRate: 0,
        },
        {
          name: "Lotto $10.00",
          category: "Lotto",
          price: 10.0,
          barcode: "LOTTO10",
          taxRate: 0,
        },
        {
          name: "Lotto $12.00",
          category: "Lotto",
          price: 12.0,
          barcode: "LOTTO12",
          taxRate: 0,
        },
        {
          name: "Lotto $15.00",
          category: "Lotto",
          price: 15.0,
          barcode: "LOTTO15",
          taxRate: 0,
        },
        {
          name: "Lotto $20.00",
          category: "Lotto",
          price: 20.0,
          barcode: "LOTTO20",
          taxRate: 0,
        },
        {
          name: "Lotto $25.00",
          category: "Lotto",
          price: 25.0,
          barcode: "LOTTO25",
          taxRate: 0,
        },
        {
          name: "Lotto $30.00",
          category: "Lotto",
          price: 30.0,
          barcode: "LOTTO30",
          taxRate: 0,
        },
        {
          name: "Lotto $50.00",
          category: "Lotto",
          price: 50.0,
          barcode: "LOTTO50",
          taxRate: 0,
        },
        {
          name: "Lotto $75.00",
          category: "Lotto",
          price: 75.0,
          barcode: "LOTTO75",
          taxRate: 0,
        },
        {
          name: "Lotto $100.00",
          category: "Lotto",
          price: 100.0,
          barcode: "LOTTO100",
          taxRate: 0,
        },

        // Lotto instant items (scratch cards)
        {
          name: "Crossword",
          category: "Lotto instant",
          price: 5.0,
          barcode: "CROSS5",
          taxRate: 0,
        },
        {
          name: "Plinko",
          category: "Lotto instant",
          price: 10.0,
          barcode: "PLINKO10",
          taxRate: 0,
        },
        {
          name: "The Big Spin",
          category: "Lotto instant",
          price: 20.0,
          barcode: "BIGSPIN20",
          taxRate: 0,
        },
        {
          name: "Diamond",
          category: "Lotto instant",
          price: 20.0,
          barcode: "DIAMOND20",
          taxRate: 0,
        },
        {
          name: "Extreme",
          category: "Lotto instant",
          price: 30.0,
          barcode: "EXTREME30",
          taxRate: 0,
        },
        {
          name: "Gift Pack",
          category: "Lotto instant",
          price: 20.0,
          barcode: "GIFTPACK",
          taxRate: 0,
        },
        {
          name: "Cash Blast",
          category: "Lotto instant",
          price: 10.0,
          barcode: "CASHBLAST",
          taxRate: 0,
        },
        {
          name: "Lucky 7s",
          category: "Lotto instant",
          price: 5.0,
          barcode: "LUCKY7",
          taxRate: 0,
        },
        {
          name: "Money Bags",
          category: "Lotto instant",
          price: 25.0,
          barcode: "MONEYBAG",
          taxRate: 0,
        },
        {
          name: "Triple Gold",
          category: "Lotto instant",
          price: 15.0,
          barcode: "TRIPLEGOLD",
          taxRate: 0,
        },
      ];

      const insertResult = await itemCollection.insertMany(lotteryItemsToAdd);
      console.log(
        `✅ Added ${insertResult.insertedCount} lottery items to database`
      );

      // Show what was added
      console.log("\n📦 Added lottery items:");
      lotteryItemsToAdd.forEach((item) => {
        console.log(`   - ${item.name} (${item.category}) - $${item.price}`);
      });
    }

    // Verify lottery items are now available
    const finalLotteryItems = await itemCollection
      .find({
        $or: [{ category: "Lotto" }, { category: "Lotto instant" }],
      })
      .toArray();

    console.log(`\n✅ Final lottery items count: ${finalLotteryItems.length}`);
    console.log(
      `   Lotto machine items: ${
        finalLotteryItems.filter((i) => i.category === "Lotto").length
      }`
    );
    console.log(
      `   Lotto instant items: ${
        finalLotteryItems.filter((i) => i.category === "Lotto instant").length
      }`
    );
  } catch (error) {
    console.error("Error checking/adding lottery items:", error);
  } finally {
    await client.close();
  }
}

checkAndAddLotteryItems();
