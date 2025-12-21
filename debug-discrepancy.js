require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function debugDiscrepancy() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("convenience_store");
    const collection = db.collection("transactions");

    console.log("🔍 Debugging Frontend vs Database Discrepancy\n");

    // Method 1: Direct database aggregation (what our verification shows)
    const dbVerification = await collection
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date("2025-07-01T00:00:00Z"),
              $lt: new Date("2025-08-01T00:00:00Z"),
            },
            "items.category": "Grocery",
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$total" },
            totalTransactions: { $sum: 1 },
          },
        },
      ])
      .toArray();

    console.log("📊 DATABASE AGGREGATION METHOD:");
    if (dbVerification.length > 0) {
      console.log(`Total: $${dbVerification[0].totalSales.toFixed(2)}`);
      console.log(`Transactions: ${dbVerification[0].totalTransactions}`);
    }

    // Method 2: Frontend-style calculation (item by item)
    const allJulyTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00Z"),
          $lt: new Date("2025-08-01T00:00:00Z"),
        },
      })
      .toArray();

    console.log(`\n📊 ALL JULY TRANSACTIONS: ${allJulyTransactions.length}`);

    // Filter for grocery transactions (frontend way)
    const groceryTransactions = allJulyTransactions.filter(
      (t) => t.items && t.items.some((item) => item.category === "Grocery")
    );

    console.log(
      `📊 GROCERY TRANSACTIONS (frontend filter): ${groceryTransactions.length}`
    );

    // Calculate total using transaction.total (like database)
    const transactionTotalSum = groceryTransactions.reduce(
      (sum, t) => sum + t.total,
      0
    );
    console.log(
      `💰 Sum of transaction.total: $${transactionTotalSum.toFixed(2)}`
    );

    // Calculate total using frontend item calculation
    let frontendTotal = 0;
    let itemCount = 0;
    let transactionCount = 0;

    const categoriesInTransactions = new Set();

    groceryTransactions.forEach((transaction) => {
      let hasGroceryItems = false;
      const items = transaction.items || [];

      items.forEach((item) => {
        if (item && item.category === "Grocery") {
          hasGroceryItems = true;
          const itemTotal = (item.price || 0) * (item.quantity || 0);
          frontendTotal += itemTotal;
          itemCount += item.quantity || 0;
        }
        if (item && item.category) {
          categoriesInTransactions.add(item.category);
        }
      });

      if (hasGroceryItems) {
        transactionCount++;
      }
    });

    console.log(`\n📊 FRONTEND CALCULATION METHOD:`);
    console.log(`Total: $${frontendTotal.toFixed(2)}`);
    console.log(`Transactions: ${transactionCount}`);
    console.log(`Items: ${itemCount}`);

    console.log(`\n🔍 COMPARISON:`);
    console.log(
      `Database method: $${transactionTotalSum.toFixed(2)} (${
        groceryTransactions.length
      } transactions)`
    );
    console.log(
      `Frontend method: $${frontendTotal.toFixed(
        2
      )} (${transactionCount} transactions)`
    );
    console.log(`Your reported: $6,175.26 (248 transactions)`);
    console.log(`Verification script: $7,425.95 (249 transactions)`);

    const dbDifference = Math.abs(transactionTotalSum - 7425.95);
    const frontendDifference = Math.abs(frontendTotal - 6175.26);

    console.log(`\n📈 ANALYSIS:`);
    console.log(`Database vs Expected: $${dbDifference.toFixed(2)} difference`);
    console.log(
      `Frontend vs Your Report: $${frontendDifference.toFixed(2)} difference`
    );

    if (Math.abs(transactionTotalSum - frontendTotal) > 0.01) {
      console.log(
        `\n⚠️  ISSUE: Frontend calculation differs from database total!`
      );
      console.log(
        `   This suggests items have price != (transaction.total / item.quantity)`
      );
      console.log(`   or there are tax/rounding differences`);

      // Check a few sample transactions
      console.log(`\n🔍 Sample transaction analysis:`);
      for (let i = 0; i < 3 && i < groceryTransactions.length; i++) {
        const t = groceryTransactions[i];
        const itemsTotal = t.items.reduce(
          (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
          0
        );

        console.log(`Transaction ${t.transactionId}:`);
        console.log(`  transaction.total: $${t.total}`);
        console.log(`  sum of items: $${itemsTotal.toFixed(2)}`);
        console.log(
          `  difference: $${Math.abs(t.total - itemsTotal).toFixed(2)}`
        );
        console.log(`  tax: $${t.tax || 0}`);
        console.log(`  subtotal: $${t.subtotal || 0}`);
      }
    }

    // Check for mixed category transactions
    const mixedTransactions = allJulyTransactions.filter((t) => {
      const categories = new Set();
      (t.items || []).forEach((item) => {
        if (item && item.category) categories.add(item.category);
      });
      return categories.size > 1;
    });

    console.log(
      `\n🔄 Mixed category transactions: ${mixedTransactions.length}`
    );

    // Categories found
    console.log(
      `\n🏷️ Categories in July: ${Array.from(categoriesInTransactions).join(
        ", "
      )}`
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("\n🔌 Connection closed");
  }
}

debugDiscrepancy();
