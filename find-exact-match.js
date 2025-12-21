require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function findExactMatch() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("convenience_store");
    const collection = db.collection("transactions");

    console.log("🎯 Searching for exact $6,175.26 match\n");

    // Let's try different combinations that might result in $6,175.26
    const target = 6175.26;

    // Check if there are transactions being filtered out by some criteria
    const allJulyTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00Z"),
          $lt: new Date("2025-08-01T00:00:00Z"),
        },
      })
      .toArray();

    console.log(`📊 Total July transactions: ${allJulyTransactions.length}`);

    // Separate grocery vs non-grocery
    const groceryTransactions = allJulyTransactions.filter(
      (t) => t.items && t.items.some((item) => item.category === "Grocery")
    );
    const alcoholTransactions = allJulyTransactions.filter(
      (t) => t.items && t.items.some((item) => item.category === "Alcohol")
    );

    console.log(`🛒 Grocery transactions: ${groceryTransactions.length}`);
    console.log(`🍺 Alcohol transactions: ${alcoholTransactions.length}`);

    // Calculate different totals for grocery
    const groceryTotal = groceryTransactions.reduce(
      (sum, t) => sum + t.total,
      0
    );
    const grocerySubtotal = groceryTransactions.reduce(
      (sum, t) => sum + (t.subtotal || 0),
      0
    );

    console.log(`\n💰 Grocery totals:`);
    console.log(`Total with tax: $${groceryTotal.toFixed(2)}`);
    console.log(`Subtotal (before tax): $${grocerySubtotal.toFixed(2)}`);

    // Check if frontend might be excluding some transactions
    // Maybe transactions without proper transaction IDs?
    const groceryWithTransactionId = groceryTransactions.filter(
      (t) => t.transactionId
    );
    const groceryWithTransactionIdTotal = groceryWithTransactionId.reduce(
      (sum, t) => sum + t.total,
      0
    );

    console.log(
      `\n🆔 Grocery with transaction ID: ${groceryWithTransactionId.length} transactions`
    );
    console.log(`Total: $${groceryWithTransactionIdTotal.toFixed(2)}`);

    // Check if some transactions might be missing payment breakdown
    const groceryWithPayment = groceryTransactions.filter(
      (t) => t.paymentBreakdown && t.paymentBreakdown.length > 0
    );
    const groceryWithPaymentTotal = groceryWithPayment.reduce(
      (sum, t) => sum + t.total,
      0
    );

    console.log(
      `\n💳 Grocery with payment breakdown: ${groceryWithPayment.length} transactions`
    );
    console.log(`Total: $${groceryWithPaymentTotal.toFixed(2)}`);

    // Check for transactions with 0 unpaid
    const groceryNotUnpaid = groceryTransactions.filter(
      (t) => (t.unpaid || 0) === 0
    );
    const groceryNotUnpaidTotal = groceryNotUnpaid.reduce(
      (sum, t) => sum + t.total,
      0
    );

    console.log(
      `\n✅ Grocery with $0 unpaid: ${groceryNotUnpaid.length} transactions`
    );
    console.log(`Total: $${groceryNotUnpaidTotal.toFixed(2)}`);

    // Try to find the exact match by testing various exclusions
    console.log(`\n🔍 Testing exclusion scenarios to match $${target}:`);

    // Maybe excluding certain transaction IDs or time ranges?
    let closestMatch = null;
    let closestDifference = Infinity;

    // Test excluding first N transactions
    for (
      let exclude = 0;
      exclude < Math.min(50, groceryTransactions.length);
      exclude++
    ) {
      const subset = groceryTransactions.slice(exclude);
      const subsetTotal = subset.reduce((sum, t) => sum + t.total, 0);
      const difference = Math.abs(subsetTotal - target);

      if (difference < closestDifference) {
        closestDifference = difference;
        closestMatch = {
          type: `Excluding first ${exclude} transactions`,
          total: subsetTotal,
          count: subset.length,
          difference: difference,
        };
      }
    }

    // Test excluding last N transactions
    for (
      let exclude = 0;
      exclude < Math.min(50, groceryTransactions.length);
      exclude++
    ) {
      const subset = groceryTransactions.slice(0, -exclude || undefined);
      const subsetTotal = subset.reduce((sum, t) => sum + t.total, 0);
      const difference = Math.abs(subsetTotal - target);

      if (difference < closestDifference) {
        closestDifference = difference;
        closestMatch = {
          type: `Excluding last ${exclude} transactions`,
          total: subsetTotal,
          count: subset.length,
          difference: difference,
        };
      }
    }

    // Test excluding by payment method
    const cashOnly = groceryTransactions.filter(
      (t) =>
        t.paymentMethod === "cash" ||
        (t.paymentBreakdown &&
          t.paymentBreakdown.every((p) => p.method === "cash"))
    );
    const cashOnlyTotal = cashOnly.reduce((sum, t) => sum + t.total, 0);
    const cashDifference = Math.abs(cashOnlyTotal - target);

    if (cashDifference < closestDifference) {
      closestDifference = cashDifference;
      closestMatch = {
        type: "Cash payments only",
        total: cashOnlyTotal,
        count: cashOnly.length,
        difference: cashDifference,
      };
    }

    if (closestMatch) {
      console.log(`🎯 Closest match: ${closestMatch.type}`);
      console.log(
        `   Total: $${closestMatch.total.toFixed(2)} (${
          closestMatch.count
        } transactions)`
      );
      console.log(`   Difference: $${closestMatch.difference.toFixed(2)}`);

      if (closestMatch.difference < 10) {
        console.log(`   ✅ This might be what the frontend is showing!`);
      }
    }

    // Check specific date ranges that might be filtered differently
    console.log("\n📅 Testing different date interpretations:");

    // Maybe frontend is using local time vs UTC?
    const localTimeRange = await collection
      .aggregate([
        {
          $addFields: {
            localDate: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$timestamp",
                timezone: "America/Toronto", // Eastern time
              },
            },
          },
        },
        {
          $match: {
            localDate: { $regex: "^2025-07" },
            "items.category": "Grocery",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    if (localTimeRange.length > 0) {
      const localTotal = localTimeRange[0].total;
      console.log(
        `Local timezone filtering: $${localTotal.toFixed(2)} (${
          localTimeRange[0].count
        } transactions)`
      );
      if (Math.abs(localTotal - target) < 10) {
        console.log(`   🎯 POTENTIAL MATCH: Local timezone difference!`);
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("\n🔌 Connection closed");
  }
}

findExactMatch();
