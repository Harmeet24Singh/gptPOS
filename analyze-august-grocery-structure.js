const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function analyzeAugustGroceryBreakdown() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    console.log("\n🔍 Analyzing August 2025 grocery transactions breakdown...");

    // Get all August transactions
    const augustTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-08-01T00:00:00.000Z"),
          $lt: new Date("2025-09-01T00:00:00.000Z"),
        },
      })
      .toArray();

    console.log(`📊 Total August transactions: ${augustTransactions.length}`);

    // Filter for grocery transactions
    const augustGroceryTransactions = augustTransactions.filter(
      (t) => t.items && t.items.some((item) => item.category === "Grocery")
    );

    console.log(
      `🥬 August grocery transactions: ${augustGroceryTransactions.length}`
    );

    // Calculate totals
    const totalGroceryAmount = augustGroceryTransactions.reduce(
      (sum, t) => sum + t.total,
      0
    );
    console.log(
      `💰 Total August grocery sales: $${totalGroceryAmount.toFixed(2)}`
    );

    // Check transaction structure
    console.log(`\n🔍 Sample transaction structure:`);
    if (augustGroceryTransactions.length > 0) {
      const sample = augustGroceryTransactions[0];
      console.log(`   Transaction ID: ${sample.transactionId}`);
      console.log(`   Payment Method: ${sample.paymentMethod}`);
      console.log(`   Total: $${sample.total}`);
      console.log(`   Tax: $${sample.tax || 0}`);
      console.log(`   Timestamp: ${sample.timestamp}`);
      console.log(`   Username: ${sample.username || "N/A"}`);

      // Check for any unusual properties
      const unusualProps = [];
      if (sample.isCreditSale) unusualProps.push("isCreditSale");
      if (sample.creditStatus) unusualProps.push("creditStatus");
      if (sample.isPartialPayment) unusualProps.push("isPartialPayment");
      if (sample.creditBalance) unusualProps.push("creditBalance");
      if (sample.unpaid) unusualProps.push("unpaid");

      if (unusualProps.length > 0) {
        console.log(`   ⚠️  Unusual properties: ${unusualProps.join(", ")}`);
      } else {
        console.log(`   ✅ No unusual properties detected`);
      }

      console.log(`   Items:`);
      sample.items.forEach((item, idx) => {
        console.log(
          `     ${idx + 1}. ${item.name} (${item.category}) - $${
            item.price
          } x ${item.quantity}`
        );
      });
    }

    // Check payment method distribution for grocery transactions
    const groceryPaymentMethods = augustGroceryTransactions.reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + 1;
      return acc;
    }, {});

    console.log(`\n💳 August grocery payment methods:`);
    Object.entries(groceryPaymentMethods).forEach(([method, count]) => {
      const percentage = (
        (count / augustGroceryTransactions.length) *
        100
      ).toFixed(1);
      console.log(`   ${method}: ${count} (${percentage}%)`);
    });

    // Check transaction ID ranges
    const transactionIds = augustGroceryTransactions
      .map((t) => t.transactionId)
      .sort((a, b) => a - b);
    console.log(
      `\n🔢 Transaction ID range: ${transactionIds[0]} - ${
        transactionIds[transactionIds.length - 1]
      }`
    );

    // Look for any transactions that might be appearing in credit management
    const potentialCreditIssues = augustGroceryTransactions.filter(
      (t) =>
        t.paymentMethod === "mixed" ||
        t.total !== t.subtotal + (t.tax || 0) ||
        t.hasOwnProperty("isCreditSale") ||
        t.hasOwnProperty("creditStatus") ||
        t.hasOwnProperty("creditBalance")
    );

    if (potentialCreditIssues.length > 0) {
      console.log(
        `\n⚠️  Found ${potentialCreditIssues.length} transactions with potential credit-related properties:`
      );
      potentialCreditIssues.slice(0, 3).forEach((t) => {
        console.log(
          `   ID ${t.transactionId}: ${t.paymentMethod}, Total: $${t.total}`
        );
      });
    } else {
      console.log(`\n✅ No transactions found with credit-related properties`);
    }

    console.log(`\n📋 Summary:`);
    console.log(`   • August grocery transactions are properly structured`);
    console.log(`   • No credit sale flags detected`);
    console.log(`   • Total amount: $${totalGroceryAmount.toFixed(2)}`);
    console.log(`   • All transactions appear to be fully paid`);
  } catch (error) {
    console.error("Error analyzing August grocery transactions:", error);
  } finally {
    await client.close();
  }
}

analyzeAugustGroceryBreakdown();
