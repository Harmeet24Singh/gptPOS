const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function investigateJulyCategories() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Get ALL July transactions
    const allJulyTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
      })
      .toArray();

    console.log(
      `\n📊 ALL July 2025 Transactions: ${allJulyTransactions.length}`
    );

    // Analyze categories in each transaction
    const categoryBreakdown = {};
    const mixedTransactions = [];
    let totalSales = 0;

    allJulyTransactions.forEach((transaction) => {
      totalSales += transaction.total;
      const categories = [
        ...new Set(transaction.items.map((item) => item.category)),
      ];

      if (categories.length > 1) {
        mixedTransactions.push({
          id: transaction.transactionId,
          categories: categories,
          total: transaction.total,
          items: transaction.items,
        });
      }

      // Track each category found
      transaction.items.forEach((item) => {
        if (!categoryBreakdown[item.category]) {
          categoryBreakdown[item.category] = {
            count: 0,
            value: 0,
            transactions: new Set(),
          };
        }
        categoryBreakdown[item.category].count += item.quantity;
        categoryBreakdown[item.category].value +=
          item.total || item.price * item.quantity;
        categoryBreakdown[item.category].transactions.add(
          transaction.transactionId
        );
      });
    });

    console.log(`\n💰 Total sales: $${totalSales.toFixed(2)}`);

    console.log(`\n📦 Category breakdown:`);
    Object.entries(categoryBreakdown).forEach(([category, data]) => {
      console.log(
        `${category}: $${data.value.toFixed(2)} (${data.count} items, ${
          data.transactions.size
        } transactions)`
      );
    });

    if (mixedTransactions.length > 0) {
      console.log(
        `\n⚠️  Found ${mixedTransactions.length} MIXED transactions with multiple categories:`
      );
      mixedTransactions.slice(0, 5).forEach((t) => {
        console.log(
          `\nTransaction ${t.id}: ${t.categories.join(
            " + "
          )} - $${t.total.toFixed(2)}`
        );
        t.items.forEach((item) => {
          console.log(
            `  - ${item.name} (${item.category}): $${(
              item.total || item.price * item.quantity
            ).toFixed(2)}`
          );
        });
      });
    }

    // Check specifically for alcohol-only transactions
    const alcoholOnlyTransactions = allJulyTransactions.filter((t) =>
      t.items.every((item) => item.category === "Alcohol")
    );

    const alcoholOnlyValue = alcoholOnlyTransactions.reduce(
      (sum, t) => sum + t.total,
      0
    );

    console.log(
      `\n🍺 Pure alcohol transactions: ${alcoholOnlyTransactions.length}`
    );
    console.log(`🍺 Pure alcohol value: $${alcoholOnlyValue.toFixed(2)}`);

    // Check for tobacco transactions
    const tobaccoTransactions = allJulyTransactions.filter((t) =>
      t.items.some((item) => item.category === "Tobacco")
    );

    console.log(
      `\n🚬 Transactions with tobacco: ${tobaccoTransactions.length}`
    );
    if (tobaccoTransactions.length > 0) {
      console.log(`🚬 Sample tobacco items found:`);
      const tobaccoItems = new Set();
      tobaccoTransactions.slice(0, 3).forEach((t) => {
        t.items.forEach((item) => {
          if (item.category === "Tobacco") {
            tobaccoItems.add(`${item.name} - $${item.price}`);
          }
        });
      });
      Array.from(tobaccoItems).forEach((item) => console.log(`  - ${item}`));
    }
  } catch (error) {
    console.error("Error investigating July categories:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

// Run the script
investigateJulyCategories();
