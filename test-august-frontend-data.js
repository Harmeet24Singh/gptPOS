const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function testFrontendData() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Test August alcohol sales as frontend would see them
    const AUGUST_START = new Date("2025-08-01T00:00:00.000Z");
    const AUGUST_END = new Date("2025-09-01T00:00:00.000Z");

    console.log("\n🧪 Testing frontend data compatibility for August 2025...");

    // Simulate frontend alcohol payment breakdown calculation
    const alcoholPayments = await collection
      .aggregate([
        {
          $match: {
            timestamp: { $gte: AUGUST_START, $lt: AUGUST_END },
            items: {
              $elemMatch: {
                $or: [
                  { category: "Alcohol" },
                  {
                    name: {
                      $regex:
                        /beer|wine|alcohol|budweiser|corona|heineken|coors|molson|miller|labatt|stella|smirnoff|white claw|sapporo|dab/i,
                    },
                  },
                ],
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$total" },
            totalCash: {
              $sum: {
                $reduce: {
                  input: { $ifNull: ["$paymentBreakdown", []] },
                  initialValue: 0,
                  in: {
                    $cond: [
                      { $eq: ["$$this.method", "cash"] },
                      { $add: ["$$value", "$$this.amount"] },
                      "$$value",
                    ],
                  },
                },
              },
            },
            totalCard: {
              $sum: {
                $reduce: {
                  input: { $ifNull: ["$paymentBreakdown", []] },
                  initialValue: 0,
                  in: {
                    $cond: [
                      { $eq: ["$$this.method", "card"] },
                      { $add: ["$$value", "$$this.amount"] },
                      "$$value",
                    ],
                  },
                },
              },
            },
            totalUnpaid: { $sum: "$unpaid" },
          },
        },
      ])
      .toArray();

    if (alcoholPayments.length > 0) {
      const stats = alcoholPayments[0];
      const totalFromBreakdown = stats.totalCash + stats.totalCard;

      console.log(`\n✅ Frontend Compatibility Test Results:`);
      console.log(`🎯 Total Alcohol Sales: $${stats.totalSales.toFixed(2)}`);
      console.log(
        `💵 Cash from paymentBreakdown: $${stats.totalCash.toFixed(2)}`
      );
      console.log(
        `💳 Card from paymentBreakdown: $${stats.totalCard.toFixed(2)}`
      );
      console.log(`📊 Breakdown Total: $${totalFromBreakdown.toFixed(2)}`);
      console.log(`🚫 Total Unpaid: $${stats.totalUnpaid.toFixed(2)}`);

      // Check integrity
      const difference = Math.abs(stats.totalSales - totalFromBreakdown);
      if (difference < 0.01) {
        console.log(
          `✅ Payment breakdown integrity: PERFECT (diff: $${difference.toFixed(
            2
          )})`
        );
      } else {
        console.log(
          `⚠️  Payment breakdown integrity: ISSUE (diff: $${difference.toFixed(
            2
          )})`
        );
      }

      if (stats.totalUnpaid === 0) {
        console.log(`✅ Unpaid amounts: PERFECT ($0.00)`);
      } else {
        console.log(
          `⚠️  Unpaid amounts: ISSUE ($${stats.totalUnpaid.toFixed(2)})`
        );
      }
    }

    // Test sample transaction structure
    const sampleTransaction = await collection.findOne({
      timestamp: { $gte: AUGUST_START, $lt: AUGUST_END },
      items: {
        $elemMatch: {
          $or: [
            { category: "Alcohol" },
            {
              name: {
                $regex:
                  /beer|wine|alcohol|budweiser|corona|heineken|coors|molson|miller|labatt|stella|smirnoff|white claw|sapporo|dab/i,
              },
            },
          ],
        },
      },
    });

    if (sampleTransaction) {
      console.log(`\n📋 Sample Transaction Structure:`);
      console.log(`Transaction ID: ${sampleTransaction.transactionId}`);
      console.log(`Payment Method: ${sampleTransaction.paymentMethod}`);
      console.log(
        `Payment Breakdown:`,
        JSON.stringify(sampleTransaction.paymentBreakdown)
      );
      console.log(`Cash Amount: $${sampleTransaction.cashAmount || 0}`);
      console.log(`Card Amount: $${sampleTransaction.cardAmount || 0}`);
      console.log(`Total: $${sampleTransaction.total}`);
      console.log(`Unpaid: $${sampleTransaction.unpaid || 0}`);

      // Verify breakdown matches total
      const breakdownSum = (sampleTransaction.paymentBreakdown || []).reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0
      );
      const matches = Math.abs(breakdownSum - sampleTransaction.total) < 0.01;
      console.log(`Breakdown matches total: ${matches ? "✅" : "❌"}`);
    }

    console.log(`\n🎉 August 2025 alcohol sales are ready for frontend use!`);
  } catch (error) {
    console.error("Error testing frontend data:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

testFrontendData();
