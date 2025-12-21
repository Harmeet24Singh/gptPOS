require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function checkGroceryTaxCalculation() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("convenience_store");
    const collection = db.collection("transactions");

    console.log("🔍 Checking Grocery Sales Card Tax Calculation\n");

    // Get July 2025 grocery transactions (what frontend uses)
    const monthlyTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00Z"),
          $lt: new Date("2025-08-01T00:00:00Z"),
        },
      })
      .toArray();

    const groceryTransactions = monthlyTransactions.filter(
      (t) => t.items && t.items.some((item) => item.category === "Grocery")
    );

    console.log(
      `📊 Found ${groceryTransactions.length} grocery transactions in July 2025\n`
    );

    // Method 1: Current Frontend Logic (with proportional tax)
    const categorySalesData = {};

    // First pass: collect subtotals
    groceryTransactions.forEach((transaction) => {
      const items = transaction.items || [];

      items.forEach((item) => {
        if (!item || !item.category || item.category !== "Grocery") return;

        const itemSubtotal = (item.price || 0) * (item.quantity || 0);

        if (!categorySalesData.Grocery) {
          categorySalesData.Grocery = {
            totalSales: 0,
            itemsSold: 0,
            transactions: 0,
            subtotal: 0,
          };
        }

        categorySalesData.Grocery.subtotal += itemSubtotal;
        categorySalesData.Grocery.itemsSold += item.quantity || 0;
      });
    });

    // Second pass: proportional tax calculation
    groceryTransactions.forEach((transaction) => {
      const groceryItems = (transaction.items || []).filter(
        (item) => item && item.category === "Grocery"
      );

      if (groceryItems.length > 0) {
        categorySalesData.Grocery.transactions++;

        // Calculate proportional share of transaction total
        const grocerySubtotal = groceryItems.reduce(
          (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
          0
        );
        const totalSubtotal = (transaction.items || []).reduce(
          (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
          0
        );

        const groceryProportion =
          totalSubtotal > 0 ? grocerySubtotal / totalSubtotal : 1;
        const groceryTotal = groceryProportion * (transaction.total || 0);

        categorySalesData.Grocery.totalSales += groceryTotal;
      }
    });

    console.log("🛒 CURRENT FRONTEND CALCULATION:");
    console.log("=".repeat(40));
    console.log(
      `💰 Total Sales: $${categorySalesData.Grocery.totalSales.toFixed(2)}`
    );
    console.log(`📦 Items Sold: ${categorySalesData.Grocery.itemsSold}`);
    console.log(`📊 Transactions: ${categorySalesData.Grocery.transactions}`);
    console.log(
      `📄 Subtotal: $${categorySalesData.Grocery.subtotal.toFixed(2)}`
    );

    const calculatedTax =
      categorySalesData.Grocery.totalSales - categorySalesData.Grocery.subtotal;
    console.log(`🧮 Calculated Tax: $${calculatedTax.toFixed(2)}`);

    // Method 2: Direct database aggregation (for comparison)
    const dbTotal = groceryTransactions.reduce((sum, t) => sum + t.total, 0);
    const dbSubtotal = groceryTransactions.reduce(
      (sum, t) => sum + (t.subtotal || 0),
      0
    );
    const dbTax = groceryTransactions.reduce((sum, t) => sum + (t.tax || 0), 0);

    console.log("\n📊 DATABASE TOTALS (for comparison):");
    console.log("=".repeat(40));
    console.log(`💰 Total Sales: $${dbTotal.toFixed(2)}`);
    console.log(`📄 Subtotal: $${dbSubtotal.toFixed(2)}`);
    console.log(`🧮 Tax: $${dbTax.toFixed(2)}`);
    console.log(`📊 Transactions: ${groceryTransactions.length}`);

    // Analysis
    console.log("\n🔍 ANALYSIS:");
    console.log("=".repeat(40));

    const frontendIncludesTax =
      Math.abs(
        categorySalesData.Grocery.totalSales -
          categorySalesData.Grocery.subtotal
      ) > 10;
    const taxAccuracy = Math.abs(calculatedTax - dbTax);

    if (frontendIncludesTax) {
      console.log("✅ Frontend calculation INCLUDES TAX");
      console.log(`   Frontend tax: $${calculatedTax.toFixed(2)}`);
      console.log(`   Database tax: $${dbTax.toFixed(2)}`);
      console.log(`   Difference: $${taxAccuracy.toFixed(2)}`);

      if (taxAccuracy < 5) {
        console.log("✅ Tax calculation is accurate");
      } else {
        console.log(
          "⚠️  Tax calculation has some variance (proportional distribution)"
        );
      }
    } else {
      console.log("❌ Frontend calculation EXCLUDES TAX (subtotal only)");
    }

    const totalAccuracy = Math.abs(
      categorySalesData.Grocery.totalSales - dbTotal
    );
    console.log(
      `\nTotal vs Database: ${
        totalAccuracy < 1
          ? "✅ Match"
          : "⚠️ Difference of $" + totalAccuracy.toFixed(2)
      }`
    );

    // Sample transaction analysis
    console.log("\n🔍 Sample Transaction Analysis:");
    console.log("=".repeat(40));

    const sampleTransaction = groceryTransactions[0];
    const groceryItemsInSample = sampleTransaction.items.filter(
      (item) => item && item.category === "Grocery"
    );
    const sampleGrocerySubtotal = groceryItemsInSample.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0
    );
    const sampleTotalSubtotal = sampleTransaction.items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0
    );
    const sampleProportion =
      sampleTotalSubtotal > 0 ? sampleGrocerySubtotal / sampleTotalSubtotal : 1;
    const sampleProportionalTotal = sampleProportion * sampleTransaction.total;

    console.log(`Transaction ID: ${sampleTransaction.transactionId}`);
    console.log(`Transaction total: $${sampleTransaction.total}`);
    console.log(`Transaction subtotal: $${sampleTransaction.subtotal || 0}`);
    console.log(`Transaction tax: $${sampleTransaction.tax || 0}`);
    console.log(`Grocery items subtotal: $${sampleGrocerySubtotal.toFixed(2)}`);
    console.log(`Grocery proportion: ${(sampleProportion * 100).toFixed(1)}%`);
    console.log(
      `Grocery proportional total: $${sampleProportionalTotal.toFixed(2)}`
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("\n🔌 Connection closed");
  }
}

checkGroceryTaxCalculation();
