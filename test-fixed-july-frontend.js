require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function testFixedJulyFrontend() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("convenience_store");
    const collection = db.collection("transactions");

    console.log("🔍 Testing Fixed July 2025 Frontend Logic\n");

    // Get all transactions (like frontend does)
    const savedTransactions = await collection.find().toArray();
    console.log(`📊 Total transactions loaded: ${savedTransactions.length}`);

    // Apply the FIXED frontend filtering logic
    const currentMonth = 7; // July
    const currentYear = 2025;
    const today = new Date().toDateString();

    const todayTransactions = savedTransactions.filter(
      (t) => new Date(t.timestamp).toDateString() === today
    );

    // Get July 2025 transactions for category sales (THE FIX)
    const monthlyTransactions = savedTransactions.filter((t) => {
      const transactionDate = new Date(t.timestamp);
      return (
        transactionDate.getMonth() + 1 === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });

    console.log(
      `📅 Today's transactions (Dec 19, 2025): ${todayTransactions.length}`
    );
    console.log(`📅 July 2025 transactions: ${monthlyTransactions.length}`);

    // Use the NEW logic (July data takes priority)
    const transactionsToUse =
      monthlyTransactions.length > 0
        ? monthlyTransactions
        : todayTransactions.length > 0
        ? todayTransactions
        : savedTransactions.filter((t) => {
            const transactionDate = new Date(t.timestamp);
            const daysDiff =
              (new Date() - transactionDate) / (1000 * 60 * 60 * 24);
            return daysDiff <= 7;
          });

    console.log(
      `📊 Using ${transactionsToUse.length} transactions for category calculations`
    );
    console.log(
      `🎯 Data source: ${
        monthlyTransactions.length > 0 ? "July 2025 data" : "Fallback data"
      }\n`
    );

    // Calculate category sales using FIXED frontend logic (with tax)
    const categorySalesData = {};

    // First pass: collect subtotals by category
    transactionsToUse.forEach((transaction) => {
      const items = transaction.items || [];

      items.forEach((item) => {
        if (!item || !item.category) return;

        const category = item.category;
        const itemSubtotal = (item.price || 0) * (item.quantity || 0);

        if (!categorySalesData[category]) {
          categorySalesData[category] = {
            totalSales: 0,
            itemsSold: 0,
            transactions: 0,
            subtotal: 0,
          };
        }

        categorySalesData[category].subtotal += itemSubtotal;
        categorySalesData[category].itemsSold += item.quantity || 0;
      });
    });

    // Second pass: Count transactions and calculate proportional totals (with tax)
    transactionsToUse.forEach((transaction) => {
      const categoriesInTransaction = new Set();
      const categorySubtotals = {};
      let totalTransactionSubtotal = 0;

      // Calculate subtotals by category in this transaction
      (transaction.items || []).forEach((item) => {
        if (item && item.category) {
          categoriesInTransaction.add(item.category);
          const itemSubtotal = (item.price || 0) * (item.quantity || 0);
          categorySubtotals[item.category] =
            (categorySubtotals[item.category] || 0) + itemSubtotal;
          totalTransactionSubtotal += itemSubtotal;
        }
      });

      // Distribute transaction total (including tax) proportionally
      categoriesInTransaction.forEach((category) => {
        if (categorySalesData[category]) {
          categorySalesData[category].transactions++;

          // Calculate this category's proportional share of the transaction total
          const categoryProportion =
            totalTransactionSubtotal > 0
              ? (categorySubtotals[category] || 0) / totalTransactionSubtotal
              : 1 / categoriesInTransaction.size;

          const categoryTransactionTotal =
            categoryProportion * (transaction.total || 0);
          categorySalesData[category].totalSales += categoryTransactionTotal;
        }
      });
    });

    // Display results
    console.log("🛒 FIXED FRONTEND CATEGORY SALES:");
    console.log("=".repeat(50));

    Object.entries(categorySalesData)
      .sort((a, b) => b[1].totalSales - a[1].totalSales)
      .forEach(([category, data]) => {
        console.log(`${category}:`);
        console.log(`  💰 Total Sales: $${data.totalSales.toFixed(2)}`);
        console.log(`  📦 Items Sold: ${data.itemsSold}`);
        console.log(`  📊 Transactions: ${data.transactions}`);
        console.log(
          `  📈 Avg per Transaction: $${
            data.transactions > 0
              ? (data.totalSales / data.transactions).toFixed(2)
              : "0.00"
          }`
        );
        console.log("");
      });

    // Highlight grocery data specifically
    if (categorySalesData.Grocery) {
      const grocery = categorySalesData.Grocery;
      console.log("🎯 GROCERY SALES CARD NOW SHOWS:");
      console.log("=".repeat(30));
      console.log(`💰 Total Sales: $${grocery.totalSales.toFixed(2)}`);
      console.log(`📦 Items Sold: ${grocery.itemsSold}`);
      console.log(`📊 Transactions: ${grocery.transactions}`);
      console.log(
        `📈 Avg Transaction: $${(
          grocery.totalSales / grocery.transactions
        ).toFixed(2)}`
      );
      console.log("");

      const expectedTotal = 7425.95;
      const difference = Math.abs(grocery.totalSales - expectedTotal);

      if (difference < 1) {
        console.log("✅ SUCCESS: Grocery card should now match detailed view!");
        console.log(`✅ Expected: $${expectedTotal.toFixed(2)}`);
        console.log(`✅ Actual: $${grocery.totalSales.toFixed(2)}`);
        console.log(`✅ Difference: $${difference.toFixed(2)}`);
      } else {
        console.log(`❌ Still off by $${difference.toFixed(2)}`);
        console.log(`   Expected: $${expectedTotal.toFixed(2)}`);
        console.log(`   Got: $${grocery.totalSales.toFixed(2)}`);
      }
    } else {
      console.log("❌ No Grocery category found in results");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("\n🔌 Connection closed");
  }
}

testFixedJulyFrontend();
