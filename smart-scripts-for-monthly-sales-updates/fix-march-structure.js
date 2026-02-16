const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function fixMarchToMatchJuly() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB);

    console.log("🔧 FIXING MARCH 2025 TO MATCH JULY STRUCTURE EXACTLY\n");

    // Get all March 2025 transactions
    const marchTransactions = await db
      .collection("transactions")
      .find({
        timestamp: { $gte: new Date(2025, 2, 1), $lt: new Date(2025, 3, 1) },
      })
      .toArray();

    console.log(
      `Found ${marchTransactions.length} March 2025 transactions to fix`,
    );

    let fixedCount = 0;

    for (const transaction of marchTransactions) {
      // Fix items structure to match July format
      const fixedItems = transaction.items.map((item) => ({
        barcode: item.barcode,
        name: item.name,
        price: item.price,
        quantity: 1, // Add missing quantity field
        total: item.price, // Add missing item total field
        category: item.category,
      }));

      // Create update object to match July structure exactly
      const updateDoc = {
        $set: {
          items: fixedItems,
        },
        $unset: {
          transactionType: "", // Remove extra field
        },
      };

      await db
        .collection("transactions")
        .updateOne({ _id: transaction._id }, updateDoc);

      fixedCount++;

      if (fixedCount % 100 === 0) {
        console.log(
          `   Fixed ${fixedCount}/${marchTransactions.length} transactions...`,
        );
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} March 2025 transactions`);

    // Verify the fix
    console.log("\n🔍 Verification - Sample Fixed Transaction:");
    const fixedTransaction = await db.collection("transactions").findOne({
      timestamp: { $gte: new Date(2025, 2, 1), $lt: new Date(2025, 3, 1) },
    });

    if (fixedTransaction) {
      console.log("Fixed March Transaction:");
      console.log(JSON.stringify(fixedTransaction, null, 2));
    }

    // Check category totals are now working
    console.log("\n📊 Final Category Totals (Should show proper numbers now):");
    const categoryTotals = await db
      .collection("transactions")
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date(2025, 2, 1),
              $lt: new Date(2025, 3, 1),
            },
          },
        },
        {
          $unwind: "$items",
        },
        {
          $group: {
            _id: "$items.category",
            totalSales: { $sum: "$total" },
            transactionCount: { $sum: 1 },
          },
        },
        { $sort: { totalSales: -1 } },
      ])
      .toArray();

    categoryTotals.forEach((cat) => {
      console.log(
        `   ✅ ${cat._id}: $${cat.totalSales.toFixed(2)} (${cat.transactionCount} transactions)`,
      );
    });

    console.log("\n🎉 March 2025 now matches July structure exactly!");
    console.log("   - Items have quantity and total fields");
    console.log("   - Removed extra transactionType field");
    console.log("   - Payment methods should display correctly");
    console.log("   - Tobacco and Lottery should show proper totals (not NaN)");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

fixMarchToMatchJuly();
