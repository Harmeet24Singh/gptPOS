const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function debugUnpaidCalculation() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Get a few July transactions and manually calculate unpaid using same logic as frontend
    const julyTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
      })
      .limit(10)
      .toArray();

    console.log(
      `\n🔍 Debugging unpaid calculation for first 10 July transactions:\n`
    );

    let totalUnpaid = 0;
    let problematicTransactions = [];

    julyTransactions.forEach((transaction, idx) => {
      console.log(`${idx + 1}. Transaction ${transaction.transactionId}:`);
      console.log(`   Total: $${transaction.total}`);
      console.log(`   PaymentBreakdown:`, transaction.paymentBreakdown);

      // Replicate frontend logic
      let totalPaid = 0;
      let transactionTotal = transaction.total;
      let unpaidAmount = 0;

      if (
        transaction.paymentBreakdown &&
        Array.isArray(transaction.paymentBreakdown)
      ) {
        if (transaction.cashback > 0) {
          // Cashback logic
          totalPaid = transaction.paymentBreakdown
            .filter((payment) => payment.amount > 0)
            .reduce((sum, payment) => sum + payment.amount, 0);
          transactionTotal = transaction.finalTotal || transaction.total;
          console.log(
            `   Cashback: $${transaction.cashback}, FinalTotal: $${transaction.finalTotal}`
          );
        } else {
          // Regular transactions: Sum all payment amounts
          totalPaid = transaction.paymentBreakdown.reduce(
            (sum, payment) => sum + payment.amount,
            0
          );
        }

        unpaidAmount = transactionTotal - totalPaid;

        console.log(`   TotalPaid: $${totalPaid.toFixed(2)}`);
        console.log(`   TransactionTotal: $${transactionTotal.toFixed(2)}`);
        console.log(`   UnpaidAmount: $${unpaidAmount.toFixed(2)}`);

        if (unpaidAmount > 0.01) {
          totalUnpaid += unpaidAmount;
          problematicTransactions.push({
            id: transaction.transactionId,
            total: transaction.total,
            totalPaid: totalPaid,
            unpaid: unpaidAmount,
            paymentBreakdown: transaction.paymentBreakdown,
            cashback: transaction.cashback,
            finalTotal: transaction.finalTotal,
          });
        }
      } else {
        console.log(
          `   ⚠️  NO PAYMENT BREAKDOWN - Transaction counted as fully unpaid`
        );
        unpaidAmount = transaction.total;
        totalUnpaid += unpaidAmount;
        problematicTransactions.push({
          id: transaction.transactionId,
          total: transaction.total,
          unpaid: unpaidAmount,
          reason: "No payment breakdown",
        });
      }
      console.log("");
    });

    console.log(`💰 Total unpaid from sample: $${totalUnpaid.toFixed(2)}`);
    console.log(
      `📋 Problematic transactions: ${problematicTransactions.length}`
    );

    if (problematicTransactions.length > 0) {
      console.log(`\n⚠️  Problematic transactions:`);
      problematicTransactions.forEach((t) => {
        console.log(
          `   ${t.id}: Total=$${t.total}, Paid=$${
            t.totalPaid || "N/A"
          }, Unpaid=$${t.unpaid.toFixed(2)}`
        );
        if (t.reason) console.log(`      Reason: ${t.reason}`);
      });
    }

    // Check if this pattern explains the $3617.36
    const allJulyTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
      })
      .toArray();

    let allUnpaid = 0;
    let transactionsWithoutPaymentBreakdown = 0;

    allJulyTransactions.forEach((transaction) => {
      if (
        !transaction.paymentBreakdown ||
        transaction.paymentBreakdown.length === 0
      ) {
        allUnpaid += transaction.total;
        transactionsWithoutPaymentBreakdown++;
      } else {
        // Regular calculation
        let totalPaid = transaction.paymentBreakdown.reduce(
          (sum, payment) => sum + payment.amount,
          0
        );
        let unpaidAmount = transaction.total - totalPaid;
        if (unpaidAmount > 0.01) {
          allUnpaid += unpaidAmount;
        }
      }
    });

    console.log(`\n📊 Full calculation results:`);
    console.log(`Total transactions: ${allJulyTransactions.length}`);
    console.log(
      `Transactions without payment breakdown: ${transactionsWithoutPaymentBreakdown}`
    );
    console.log(`Calculated total unpaid: $${allUnpaid.toFixed(2)}`);
  } catch (error) {
    console.error("Error debugging unpaid calculation:", error);
  } finally {
    await client.close();
    console.log("\nConnection closed");
  }
}

debugUnpaidCalculation();
