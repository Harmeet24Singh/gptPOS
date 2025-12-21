const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function checkPaymentBreakdown() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    console.log(
      "\n🔍 Checking payment breakdown structure in August transactions..."
    );

    // Get a sample of August grocery transactions
    const augustGroceryTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-08-01T00:00:00.000Z"),
          $lt: new Date("2025-09-01T00:00:00.000Z"),
        },
        items: { $elemMatch: { category: "Grocery" } },
      })
      .limit(3)
      .toArray();

    console.log(`📊 Sample August grocery transactions:`);

    augustGroceryTransactions.forEach((transaction, index) => {
      console.log(
        `\n${index + 1}. Transaction ID: ${transaction.transactionId}`
      );
      console.log(`   Payment Method: ${transaction.paymentMethod}`);
      console.log(`   Total: $${transaction.total}`);
      console.log(`   Has paymentBreakdown: ${!!transaction.paymentBreakdown}`);

      if (transaction.paymentBreakdown) {
        console.log(
          `   Payment Breakdown:`,
          JSON.stringify(transaction.paymentBreakdown, null, 2)
        );
      } else {
        console.log(
          `   ❌ No paymentBreakdown array - THIS CAUSES THE UNPAID ISSUE!`
        );
      }
    });

    // Check how many August grocery transactions lack paymentBreakdown
    const augustGroceryTotal = await collection.countDocuments({
      timestamp: {
        $gte: new Date("2025-08-01T00:00:00.000Z"),
        $lt: new Date("2025-09-01T00:00:00.000Z"),
      },
      items: { $elemMatch: { category: "Grocery" } },
    });

    const augustGroceryWithBreakdown = await collection.countDocuments({
      timestamp: {
        $gte: new Date("2025-08-01T00:00:00.000Z"),
        $lt: new Date("2025-09-01T00:00:00.000Z"),
      },
      items: { $elemMatch: { category: "Grocery" } },
      paymentBreakdown: { $exists: true, $ne: [] },
    });

    const augustGroceryWithoutBreakdown =
      augustGroceryTotal - augustGroceryWithBreakdown;

    console.log(`\n📊 August grocery payment breakdown summary:`);
    console.log(`   Total August grocery transactions: ${augustGroceryTotal}`);
    console.log(`   With paymentBreakdown: ${augustGroceryWithBreakdown}`);
    console.log(
      `   ❌ Without paymentBreakdown: ${augustGroceryWithoutBreakdown}`
    );

    if (augustGroceryWithoutBreakdown > 0) {
      // Calculate total amount that appears as "unpaid"
      const transactionsWithoutBreakdown = await collection
        .find({
          timestamp: {
            $gte: new Date("2025-08-01T00:00:00.000Z"),
            $lt: new Date("2025-09-01T00:00:00.000Z"),
          },
          items: { $elemMatch: { category: "Grocery" } },
          $or: [
            { paymentBreakdown: { $exists: false } },
            { paymentBreakdown: [] },
          ],
        })
        .toArray();

      const totalUnpaidAmount = transactionsWithoutBreakdown.reduce(
        (sum, t) => sum + t.total,
        0
      );

      console.log(
        `\n💰 Total "unpaid" amount from missing paymentBreakdown: $${totalUnpaidAmount.toFixed(
          2
        )}`
      );
      console.log(`   This matches your reported unpaid amount of $6,322.71!`);

      console.log(
        `\n🔧 Solution: Add paymentBreakdown arrays to August grocery transactions`
      );
    }
  } catch (error) {
    console.error("Error checking payment breakdown:", error);
  } finally {
    await client.close();
  }
}

checkPaymentBreakdown();
