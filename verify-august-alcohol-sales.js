const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function verifyAugustAlcoholSales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    const MONTH_START = new Date("2025-08-01T00:00:00.000Z");
    const MONTH_END = new Date("2025-09-01T00:00:00.000Z");

    console.log("\n🔍 Verifying August 2025 alcohol sales...");

    // Overall stats
    const overallStats = await collection
      .aggregate([
        {
          $match: {
            timestamp: { $gte: MONTH_START, $lt: MONTH_END },
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
            totalTransactions: { $sum: 1 },
            avgTransaction: { $avg: "$total" },
            totalUnpaid: { $sum: "$unpaid" },
            totalCash: { $sum: "$cashAmount" },
            totalCard: { $sum: "$cardAmount" },
          },
        },
      ])
      .toArray();

    if (overallStats.length > 0) {
      const stats = overallStats[0];
      console.log(`\n📊 August 2025 Alcohol Sales Summary:`);
      console.log(`🎯 Total Sales: $${stats.totalSales.toFixed(2)}`);
      console.log(`📈 Total Transactions: ${stats.totalTransactions}`);
      console.log(
        `💰 Average Transaction: $${stats.avgTransaction.toFixed(2)}`
      );
      console.log(`🚫 Total Unpaid: $${stats.totalUnpaid.toFixed(2)}`);
      console.log(
        `💵 Cash Payments: $${stats.totalCash.toFixed(2)} (${(
          (stats.totalCash / stats.totalSales) *
          100
        ).toFixed(1)}%)`
      );
      console.log(
        `💳 Card Payments: $${stats.totalCard.toFixed(2)} (${(
          (stats.totalCard / stats.totalSales) *
          100
        ).toFixed(1)}%)`
      );
    }

    // Daily breakdown
    const dailyStats = await collection
      .aggregate([
        {
          $match: {
            timestamp: { $gte: MONTH_START, $lt: MONTH_END },
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
            _id: { $dayOfMonth: "$timestamp" },
            dayOfWeek: { $first: { $dayOfWeek: "$timestamp" } },
            count: { $sum: 1 },
            totalSales: { $sum: "$total" },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])
      .toArray();

    console.log(`\n📅 Daily Breakdown:`);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    dailyStats.forEach((day) => {
      const dayName = dayNames[day.dayOfWeek - 1];
      console.log(
        `Aug ${day._id.toString().padStart(2, "0")} (${dayName}): ${
          day.count
        } transactions - $${day.totalSales.toFixed(2)}`
      );
    });

    // Weekly pattern analysis
    const weeklyStats = await collection
      .aggregate([
        {
          $match: {
            timestamp: { $gte: MONTH_START, $lt: MONTH_END },
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
            _id: { $dayOfWeek: "$timestamp" },
            count: { $sum: 1 },
            totalSales: { $sum: "$total" },
            avgTransaction: { $avg: "$total" },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])
      .toArray();

    console.log(`\n📊 Weekly Pattern Analysis:`);
    const totalTransactions = weeklyStats.reduce(
      (sum, day) => sum + day.count,
      0
    );
    weeklyStats.forEach((day) => {
      const dayName = dayNames[day._id - 1];
      const percentage = ((day.count / totalTransactions) * 100).toFixed(1);
      console.log(
        `${dayName}: ${
          day.count
        } transactions (${percentage}%) - $${day.totalSales.toFixed(
          2
        )} - avg $${day.avgTransaction.toFixed(2)}`
      );
    });

    // Payment method verification
    const paymentStats = await collection
      .aggregate([
        {
          $match: {
            timestamp: { $gte: MONTH_START, $lt: MONTH_END },
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
            _id: "$paymentMethod",
            count: { $sum: 1 },
            totalAmount: { $sum: "$total" },
            avgAmount: { $avg: "$total" },
          },
        },
      ])
      .toArray();

    console.log(`\n💳 Payment Method Distribution:`);
    paymentStats.forEach((payment) => {
      const percentage = ((payment.count / totalTransactions) * 100).toFixed(1);
      console.log(
        `${payment._id}: ${
          payment.count
        } transactions (${percentage}%) - $${payment.totalAmount.toFixed(
          2
        )} - avg $${payment.avgAmount.toFixed(2)}`
      );
    });

    // PaymentBreakdown integrity check
    console.log(`\n🔧 PaymentBreakdown Integrity Check:`);
    const integrityIssues = await collection
      .find({
        timestamp: { $gte: MONTH_START, $lt: MONTH_END },
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
        $or: [
          { paymentBreakdown: { $exists: false } },
          { paymentBreakdown: { $not: { $type: "array" } } },
          { unpaid: { $gt: 0.01 } },
        ],
      })
      .toArray();

    if (integrityIssues.length === 0) {
      console.log(
        `✅ All transactions have proper paymentBreakdown arrays and $0.00 unpaid amounts`
      );
    } else {
      console.log(
        `⚠️  Found ${integrityIssues.length} transactions with integrity issues`
      );
      integrityIssues.slice(0, 5).forEach((issue) => {
        console.log(
          `- Transaction ${issue.transactionId}: unpaid=$${
            issue.unpaid
          }, paymentBreakdown=${JSON.stringify(issue.paymentBreakdown)}`
        );
      });
    }

    // Sample transactions
    console.log(`\n🔍 Sample Transactions:`);
    const samples = await collection
      .find({
        timestamp: { $gte: MONTH_START, $lt: MONTH_END },
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
      })
      .limit(5)
      .toArray();

    samples.forEach((sample) => {
      const date = sample.timestamp.toLocaleDateString();
      const time = sample.timestamp.toLocaleTimeString();
      const items = sample.items.map((item) => item.name).join(", ");
      console.log(
        `${sample.transactionId} - ${date} ${time} - ${
          sample.paymentMethod
        } - $${sample.total.toFixed(2)} - ${items}`
      );
    });

    console.log(`\n✅ August 2025 alcohol sales verification completed!`);
  } catch (error) {
    console.error("Error verifying August alcohol sales:", error);
  } finally {
    await client.close();
    console.log("\nConnection closed");
  }
}

verifyAugustAlcoholSales();
