const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function analyzeTobaccoItems() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const inventoryCollection = db.collection("inventory");

    console.log("\n🚬 Analyzing tobacco items in inventory...");

    // Get all tobacco items
    const tobaccoItems = await inventoryCollection
      .find({
        category: "Tobacco",
      })
      .toArray();

    console.log(`📊 Found ${tobaccoItems.length} tobacco items in inventory`);

    if (tobaccoItems.length === 0) {
      console.log(
        "❌ No tobacco items found! Need to add tobacco inventory first."
      );
      return;
    }

    // Show tobacco items with pricing
    console.log(`\n💰 Tobacco inventory details:`);
    let totalInventoryValue = 0;

    tobaccoItems.forEach((item, index) => {
      const itemValue = item.price * item.stock;
      totalInventoryValue += itemValue;

      console.log(`${index + 1}. ${item.name}`);
      console.log(`   Price: $${item.price.toFixed(2)}`);
      console.log(`   Stock: ${item.stock} units`);
      console.log(`   Value: $${itemValue.toFixed(2)}`);
      console.log(`   Taxable: ${item.taxable ? "Yes" : "No"}`);
      if (item.lowStockThreshold) {
        console.log(`   Low Stock Threshold: ${item.lowStockThreshold}`);
      }
      console.log("");
    });

    console.log(
      `📊 Total tobacco inventory value: $${totalInventoryValue.toFixed(2)}`
    );

    // Price analysis for target calculation
    const avgPrice =
      tobaccoItems.reduce((sum, item) => sum + item.price, 0) /
      tobaccoItems.length;
    const minPrice = Math.min(...tobaccoItems.map((item) => item.price));
    const maxPrice = Math.max(...tobaccoItems.map((item) => item.price));

    console.log(`\n💡 Price analysis for $11,900 target:`);
    console.log(`   Average price: $${avgPrice.toFixed(2)}`);
    console.log(`   Min price: $${minPrice.toFixed(2)}`);
    console.log(`   Max price: $${maxPrice.toFixed(2)}`);

    const estimatedTransactionsNeeded = Math.ceil(11900 / avgPrice);
    console.log(
      `   Estimated transactions needed: ~${estimatedTransactionsNeeded}`
    );

    // Check existing July transactions to avoid conflicts
    const transactionCollection = db.collection("transactions");
    const existingJulyTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
      })
      .toArray();

    console.log(
      `\n📅 Existing July transactions: ${existingJulyTransactions.length}`
    );

    if (existingJulyTransactions.length > 0) {
      const maxExistingId = Math.max(
        ...existingJulyTransactions.map((t) => t.transactionId)
      );
      const suggestedStartId = maxExistingId + 1;
      console.log(`   Max existing transaction ID: ${maxExistingId}`);
      console.log(`   Suggested starting ID: ${suggestedStartId}`);

      // Check if any existing transactions have tobacco items
      const existingTobacco = existingJulyTransactions.filter(
        (t) => t.items && t.items.some((item) => item.category === "Tobacco")
      );

      if (existingTobacco.length > 0) {
        const existingTobaccoTotal = existingTobacco.reduce(
          (sum, t) => sum + t.total,
          0
        );
        console.log(
          `   ⚠️  ${
            existingTobacco.length
          } transactions already contain tobacco items (Total: $${existingTobaccoTotal.toFixed(
            2
          )})`
        );
        console.log(
          `   Recommended: Target $${(11900 - existingTobaccoTotal).toFixed(
            2
          )} in new tobacco-only transactions`
        );
      } else {
        console.log(
          `   ✅ No existing tobacco transactions found - safe to add $11,900 in new transactions`
        );
      }
    }

    // Tax implications
    const taxableItems = tobaccoItems.filter((item) => item.taxable);
    console.log(`\n💸 Tax implications:`);
    console.log(
      `   Taxable tobacco items: ${taxableItems.length}/${tobaccoItems.length}`
    );
    console.log(`   HST rate: 13%`);
    console.log(
      `   If all taxable, subtotal needed: $${(11900 / 1.13).toFixed(2)}`
    );
  } catch (error) {
    console.error("Error analyzing tobacco items:", error);
  } finally {
    await client.close();
  }
}

analyzeTobaccoItems();
