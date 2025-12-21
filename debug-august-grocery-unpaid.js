const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function debugAugustGroceryTransactions() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    console.log(
      "\n🔍 Debugging August 2025 grocery transactions for unpaid status..."
    );

    // Get August grocery transactions
    const augustTransactions = await collection
      .find({
        transactionId: { $gte: 80800, $lt: 81800 },
        timestamp: {
          $gte: new Date("2025-08-01T00:00:00.000Z"),
          $lt: new Date("2025-09-01T00:00:00.000Z"),
        },
      })
      .toArray();

    console.log(
      `📊 Found ${augustTransactions.length} August grocery transactions`
    );

    // Check for credit sale flags and unpaid status
    let creditSales = 0;
    let unpaidTransactions = 0;
    let partialPayments = 0;
    let normalTransactions = 0;

    console.log(`\n🔍 Analyzing transaction payment status...`);

    augustTransactions.forEach((transaction, index) => {
      let isUnpaid = false;
      let reason = "";

      // Check various unpaid conditions
      if (transaction.isCreditSale && transaction.creditStatus === "unpaid") {
        creditSales++;
        isUnpaid = true;
        reason = "Credit sale marked as unpaid";
      }

      if (transaction.isPartialPayment && transaction.creditBalance > 0) {
        partialPayments++;
        isUnpaid = true;
        reason = "Partial payment with remaining balance";
      }

      if (transaction.creditStatus === "unpaid") {
        unpaidTransactions++;
        isUnpaid = true;
        reason = "Credit status is unpaid";
      }

      if (!isUnpaid) {
        normalTransactions++;
      }

      // Show first 5 problematic transactions
      if (isUnpaid && index < 5) {
        console.log(`   Transaction ${transaction.transactionId}: ${reason}`);
        console.log(`     - isCreditSale: ${transaction.isCreditSale}`);
        console.log(`     - creditStatus: ${transaction.creditStatus}`);
        console.log(`     - isPartialPayment: ${transaction.isPartialPayment}`);
        console.log(`     - creditBalance: ${transaction.creditBalance}`);
        console.log(`     - paymentMethod: ${transaction.paymentMethod}`);
        console.log(`     - total: $${transaction.total}`);
        console.log("");
      }
    });

    console.log(`\n📊 Payment Status Summary:`);
    console.log(`   ✅ Normal transactions: ${normalTransactions}`);
    console.log(`   ❌ Credit sales (unpaid): ${creditSales}`);
    console.log(`   ⚠️  Partial payments: ${partialPayments}`);
    console.log(`   🔍 Transactions with unpaid status: ${unpaidTransactions}`);

    if (creditSales > 0 || unpaidTransactions > 0 || partialPayments > 0) {
      console.log(
        `\n🔧 Found transactions incorrectly marked as unpaid. Fixing...`
      );

      // Fix all August grocery transactions to be properly paid
      const fixResult = await collection.updateMany(
        {
          transactionId: { $gte: 80800, $lt: 81800 },
          timestamp: {
            $gte: new Date("2025-08-01T00:00:00.000Z"),
            $lt: new Date("2025-09-01T00:00:00.000Z"),
          },
        },
        {
          $unset: {
            isCreditSale: "",
            creditStatus: "",
            isPartialPayment: "",
            creditBalance: "",
          },
        }
      );

      console.log(`✅ Fixed ${fixResult.modifiedCount} transactions`);

      // Verify the fix
      const verifyTransactions = await collection
        .find({
          transactionId: { $gte: 80800, $lt: 81800 },
          timestamp: {
            $gte: new Date("2025-08-01T00:00:00.000Z"),
            $lt: new Date("2025-09-01T00:00:00.000Z"),
          },
        })
        .toArray();

      const stillUnpaid = verifyTransactions.filter(
        (t) =>
          (t.isCreditSale && t.creditStatus === "unpaid") ||
          (t.isPartialPayment && t.creditBalance > 0)
      );

      console.log(
        `\n✅ Verification: ${stillUnpaid.length} transactions still marked as unpaid (should be 0)`
      );

      if (stillUnpaid.length === 0) {
        console.log(
          `🎉 All August grocery transactions are now properly marked as paid!`
        );
      }

      // Show payment method distribution
      const paymentBreakdown = verifyTransactions.reduce((acc, t) => {
        acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + 1;
        return acc;
      }, {});

      console.log(`\n💳 Payment Method Distribution:`);
      Object.entries(paymentBreakdown).forEach(([method, count]) => {
        const percentage = ((count / verifyTransactions.length) * 100).toFixed(
          1
        );
        console.log(`   ${method}: ${count} (${percentage}%)`);
      });

      const totalAmount = verifyTransactions.reduce(
        (sum, t) => sum + t.total,
        0
      );
      console.log(
        `\n💰 Total August grocery sales: $${totalAmount.toFixed(2)}`
      );
    } else {
      console.log(
        `\n✅ No unpaid transaction issues found in August grocery data.`
      );
    }
  } catch (error) {
    console.error("Error debugging August grocery transactions:", error);
  } finally {
    await client.close();
  }
}

debugAugustGroceryTransactions();
