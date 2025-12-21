const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function fixAugustGroceryPaymentBreakdown() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    console.log(
      "\n🔧 Fixing August grocery transactions missing paymentBreakdown..."
    );

    // Find August grocery transactions without paymentBreakdown
    const augustTransactionsToFix = await collection
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

    console.log(
      `📊 Found ${augustTransactionsToFix.length} transactions to fix`
    );

    if (augustTransactionsToFix.length === 0) {
      console.log("✅ No transactions need fixing!");
      return;
    }

    let fixedCount = 0;
    const totalAmountFixed = augustTransactionsToFix.reduce(
      (sum, t) => sum + t.total,
      0
    );

    console.log(`💰 Total amount to be fixed: $${totalAmountFixed.toFixed(2)}`);

    // Fix each transaction by adding the appropriate paymentBreakdown
    for (const transaction of augustTransactionsToFix) {
      const paymentBreakdown = [
        {
          method: transaction.paymentMethod,
          amount: transaction.total,
        },
      ];

      const updateResult = await collection.updateOne(
        { _id: transaction._id },
        {
          $set: {
            paymentBreakdown: paymentBreakdown,
          },
        }
      );

      if (updateResult.modifiedCount > 0) {
        fixedCount++;
      }

      // Show progress every 25 transactions
      if (fixedCount % 25 === 0) {
        console.log(
          `   Fixed ${fixedCount}/${augustTransactionsToFix.length} transactions...`
        );
      }
    }

    console.log(
      `\n✅ Successfully fixed ${fixedCount} August grocery transactions!`
    );

    // Verify the fix
    const remainingUnfixed = await collection.countDocuments({
      timestamp: {
        $gte: new Date("2025-08-01T00:00:00.000Z"),
        $lt: new Date("2025-09-01T00:00:00.000Z"),
      },
      items: { $elemMatch: { category: "Grocery" } },
      $or: [{ paymentBreakdown: { $exists: false } }, { paymentBreakdown: [] }],
    });

    console.log(
      `📊 Verification: ${remainingUnfixed} transactions still need fixing (should be 0)`
    );

    if (remainingUnfixed === 0) {
      console.log(
        `🎉 All August grocery transactions now have proper paymentBreakdown arrays!`
      );
      console.log(
        `💡 The unpaid amount of $6,322.71 should now disappear from the transactions page.`
      );

      // Show sample fixed transaction
      const sampleFixed = await collection.findOne({
        timestamp: {
          $gte: new Date("2025-08-01T00:00:00.000Z"),
          $lt: new Date("2025-09-01T00:00:00.000Z"),
        },
        items: { $elemMatch: { category: "Grocery" } },
        paymentBreakdown: { $exists: true },
      });

      if (sampleFixed) {
        console.log(
          `\n✅ Sample fixed transaction (ID ${sampleFixed.transactionId}):`
        );
        console.log(`   Payment Method: ${sampleFixed.paymentMethod}`);
        console.log(`   Total: $${sampleFixed.total}`);
        console.log(
          `   Payment Breakdown:`,
          JSON.stringify(sampleFixed.paymentBreakdown, null, 2)
        );
      }
    }
  } catch (error) {
    console.error("Error fixing payment breakdown:", error);
  } finally {
    await client.close();
  }
}

fixAugustGroceryPaymentBreakdown();
