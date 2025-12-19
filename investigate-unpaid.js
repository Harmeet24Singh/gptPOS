const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function investigateUnpaidAmount() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Check for transactions with unpaid-related fields
    console.log("\n🔍 Searching for transactions that might be counted as unpaid...\n");

    // Check 1: Transactions with isCreditSale and creditStatus = "unpaid"
    const creditUnpaid = await collection.find({
      timestamp: {
        $gte: new Date("2025-07-01T00:00:00.000Z"),
        $lt: new Date("2025-08-01T00:00:00.000Z"),
      },
      isCreditSale: true,
      creditStatus: "unpaid"
    }).toArray();

    console.log(`📋 Credit sales with unpaid status: ${creditUnpaid.length} transactions`);
    if (creditUnpaid.length > 0) {
      let totalCreditUnpaid = 0;
      creditUnpaid.forEach((t, idx) => {
        totalCreditUnpaid += t.total;
        if (idx < 10) { // Show first 10
          console.log(`  ${t.transactionId}: $${t.total} (creditStatus: ${t.creditStatus})`);
        }
      });
      console.log(`  Total credit unpaid: $${totalCreditUnpaid.toFixed(2)}`);
    }

    // Check 2: Transactions with isPartialPayment and creditBalance > 0
    const partialPayment = await collection.find({
      timestamp: {
        $gte: new Date("2025-07-01T00:00:00.000Z"),
        $lt: new Date("2025-08-01T00:00:00.000Z"),
      },
      isPartialPayment: true,
      creditBalance: { $gt: 0 }
    }).toArray();

    console.log(`\n📋 Partial payments with credit balance: ${partialPayment.length} transactions`);
    if (partialPayment.length > 0) {
      let totalPartialUnpaid = 0;
      partialPayment.forEach((t, idx) => {
        totalPartialUnpaid += t.creditBalance;
        if (idx < 10) { // Show first 10
          console.log(`  ${t.transactionId}: $${t.total} (balance: $${t.creditBalance})`);
        }
      });
      console.log(`  Total partial payment balance: $${totalPartialUnpaid.toFixed(2)}`);
    }

    // Check 3: Any transactions with credit-related fields
    const anyCredit = await collection.find({
      timestamp: {
        $gte: new Date("2025-07-01T00:00:00.000Z"),
        $lt: new Date("2025-08-01T00:00:00.000Z"),
      },
      $or: [
        { isCreditSale: { $exists: true } },
        { creditStatus: { $exists: true } },
        { isPartialPayment: { $exists: true } },
        { creditBalance: { $exists: true } },
        { creditEarnings: { $exists: true } },
        { transactionType: "credit" },
        { transactionType: "partial_credit" }
      ]
    }).toArray();

    console.log(`\n📋 Any transactions with credit-related fields: ${anyCredit.length} transactions`);
    
    if (anyCredit.length > 0) {
      console.log(`\n🔍 Sample credit-related transactions:`);
      anyCredit.slice(0, 5).forEach((t, idx) => {
        console.log(`\n${idx + 1}. Transaction ${t.transactionId}:`);
        console.log(`   Total: $${t.total}`);
        console.log(`   isCreditSale: ${t.isCreditSale}`);
        console.log(`   creditStatus: ${t.creditStatus}`);
        console.log(`   isPartialPayment: ${t.isPartialPayment}`);
        console.log(`   creditBalance: ${t.creditBalance}`);
        console.log(`   creditEarnings: ${t.creditEarnings}`);
        console.log(`   transactionType: ${t.transactionType}`);
        console.log(`   paymentMethod: ${t.paymentMethod}`);
      });

      // Calculate potential unpaid total
      let potentialUnpaid = 0;
      anyCredit.forEach(t => {
        if ((t.isCreditSale && t.creditStatus === "unpaid") || 
            (t.isPartialPayment && t.creditBalance > 0)) {
          potentialUnpaid += t.creditBalance || t.total;
        }
      });
      
      console.log(`\n💰 Calculated potential unpaid amount: $${potentialUnpaid.toFixed(2)}`);
    }

    // Check if the $3617.36 matches any specific calculation
    console.log(`\n🎯 Looking for amount close to $3617.36...`);
    
    // Check if it's a sum of specific transactions
    const allJulyTransactions = await collection.find({
      timestamp: {
        $gte: new Date("2025-07-01T00:00:00.000Z"),
        $lt: new Date("2025-08-01T00:00:00.000Z"),
      }
    }).toArray();

    console.log(`\nTotal July transactions: ${allJulyTransactions.length}`);
    console.log(`Total July sales: $${allJulyTransactions.reduce((sum, t) => sum + t.total, 0).toFixed(2)}`);

    // Check what percentage 3617.36 is of total sales
    const totalSales = allJulyTransactions.reduce((sum, t) => sum + t.total, 0);
    const unpaidPercentage = (3617.36 / totalSales * 100);
    console.log(`Unpaid amount represents ${unpaidPercentage.toFixed(2)}% of total sales`);

  } catch (error) {
    console.error("Error investigating unpaid amount:", error);
  } finally {
    await client.close();
    console.log("\nConnection closed");
  }
}

investigateUnpaidAmount();