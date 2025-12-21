const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function fixSeptemberNovemberPaymentBreakdown() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Check September 2025
    console.log("\n🔍 Checking September 2025 grocery transactions...");

    const septemberTransactionsToFix = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-09-01T00:00:00.000Z"),
          $lt: new Date("2025-10-01T00:00:00.000Z"),
        },
        items: { $elemMatch: { category: "Grocery" } },
        $or: [
          { paymentBreakdown: { $exists: false } },
          { paymentBreakdown: [] },
        ],
      })
      .toArray();

    console.log(
      `📊 September transactions needing fix: ${septemberTransactionsToFix.length}`
    );

    if (septemberTransactionsToFix.length > 0) {
      const septemberTotalAmount = septemberTransactionsToFix.reduce(
        (sum, t) => sum + t.total,
        0
      );
      console.log(
        `💰 September amount to fix: $${septemberTotalAmount.toFixed(2)}`
      );

      let septemberFixed = 0;
      for (const transaction of septemberTransactionsToFix) {
        const paymentBreakdown = [
          {
            method: transaction.paymentMethod,
            amount: transaction.total,
          },
        ];

        const updateResult = await collection.updateOne(
          { _id: transaction._id },
          { $set: { paymentBreakdown: paymentBreakdown } }
        );

        if (updateResult.modifiedCount > 0) {
          septemberFixed++;
        }

        if (septemberFixed % 25 === 0) {
          console.log(
            `   Fixed ${septemberFixed}/${septemberTransactionsToFix.length} September transactions...`
          );
        }
      }

      console.log(`✅ Fixed ${septemberFixed} September transactions`);
    } else {
      console.log("✅ No September transactions need fixing");
    }

    // Check November 2025
    console.log("\n🔍 Checking November 2025 grocery transactions...");

    const novemberTransactionsToFix = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
        items: { $elemMatch: { category: "Grocery" } },
        $or: [
          { paymentBreakdown: { $exists: false } },
          { paymentBreakdown: [] },
        ],
      })
      .toArray();

    console.log(
      `📊 November transactions needing fix: ${novemberTransactionsToFix.length}`
    );

    if (novemberTransactionsToFix.length > 0) {
      const novemberTotalAmount = novemberTransactionsToFix.reduce(
        (sum, t) => sum + t.total,
        0
      );
      console.log(
        `💰 November amount to fix: $${novemberTotalAmount.toFixed(2)}`
      );

      let novemberFixed = 0;
      for (const transaction of novemberTransactionsToFix) {
        const paymentBreakdown = [
          {
            method: transaction.paymentMethod,
            amount: transaction.total,
          },
        ];

        const updateResult = await collection.updateOne(
          { _id: transaction._id },
          { $set: { paymentBreakdown: paymentBreakdown } }
        );

        if (updateResult.modifiedCount > 0) {
          novemberFixed++;
        }

        if (novemberFixed % 25 === 0) {
          console.log(
            `   Fixed ${novemberFixed}/${novemberTransactionsToFix.length} November transactions...`
          );
        }
      }

      console.log(`✅ Fixed ${novemberFixed} November transactions`);
    } else {
      console.log("✅ No November transactions need fixing");
    }

    // Final verification
    console.log("\n📊 Final Verification:");

    const septemberRemaining = await collection.countDocuments({
      timestamp: {
        $gte: new Date("2025-09-01T00:00:00.000Z"),
        $lt: new Date("2025-10-01T00:00:00.000Z"),
      },
      items: { $elemMatch: { category: "Grocery" } },
      $or: [{ paymentBreakdown: { $exists: false } }, { paymentBreakdown: [] }],
    });

    const novemberRemaining = await collection.countDocuments({
      timestamp: {
        $gte: new Date("2025-11-01T00:00:00.000Z"),
        $lt: new Date("2025-12-01T00:00:00.000Z"),
      },
      items: { $elemMatch: { category: "Grocery" } },
      $or: [{ paymentBreakdown: { $exists: false } }, { paymentBreakdown: [] }],
    });

    console.log(
      `   September transactions still needing fix: ${septemberRemaining} (should be 0)`
    );
    console.log(
      `   November transactions still needing fix: ${novemberRemaining} (should be 0)`
    );

    if (septemberRemaining === 0 && novemberRemaining === 0) {
      console.log(
        `\n🎉 All September and November grocery transactions are now fixed!`
      );
      console.log(`💡 No more unpaid amounts should appear from these months.`);

      // Show totals for all fixed months
      const augustTotal = await collection
        .aggregate([
          {
            $match: {
              timestamp: {
                $gte: new Date("2025-08-01T00:00:00.000Z"),
                $lt: new Date("2025-09-01T00:00:00.000Z"),
              },
              items: { $elemMatch: { category: "Grocery" } },
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

      const septemberTotal = await collection
        .aggregate([
          {
            $match: {
              timestamp: {
                $gte: new Date("2025-09-01T00:00:00.000Z"),
                $lt: new Date("2025-10-01T00:00:00.000Z"),
              },
              items: { $elemMatch: { category: "Grocery" } },
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

      const novemberTotal = await collection
        .aggregate([
          {
            $match: {
              timestamp: {
                $gte: new Date("2025-11-01T00:00:00.000Z"),
                $lt: new Date("2025-12-01T00:00:00.000Z"),
              },
              items: { $elemMatch: { category: "Grocery" } },
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

      console.log(`\n📊 Summary of all fixed grocery sales:`);
      if (augustTotal[0]) {
        console.log(
          `   August: $${augustTotal[0].total.toFixed(2)} (${
            augustTotal[0].count
          } transactions)`
        );
      }
      if (septemberTotal[0]) {
        console.log(
          `   September: $${septemberTotal[0].total.toFixed(2)} (${
            septemberTotal[0].count
          } transactions)`
        );
      }
      if (novemberTotal[0]) {
        console.log(
          `   November: $${novemberTotal[0].total.toFixed(2)} (${
            novemberTotal[0].count
          } transactions)`
        );
      }
    }
  } catch (error) {
    console.error("Error fixing September/November payment breakdown:", error);
  } finally {
    await client.close();
  }
}

fixSeptemberNovemberPaymentBreakdown();
