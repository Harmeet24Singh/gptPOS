const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function enhanceAugustAlcoholSales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    const MONTH_START = new Date("2025-08-01T00:00:00.000Z");
    const MONTH_END = new Date("2025-09-01T00:00:00.000Z");

    console.log(
      "\n🔧 Enhancing August 2025 alcohol sales with realistic patterns..."
    );

    // Step 1: Get all August alcohol transactions
    const augustTransactions = await collection
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
      .toArray();

    console.log(
      `📊 Found ${augustTransactions.length} August alcohol transactions`
    );

    if (augustTransactions.length === 0) {
      console.log(
        "❌ No August alcohol transactions found. Run generate-alcohol-sales-august.js first."
      );
      return;
    }

    // Step 2: Apply weekly business patterns with realistic shuffling
    console.log("\n🗓️  Applying weekly business patterns...");

    // Weekly patterns (same as July)
    const dayMultipliers = {
      0: 0.08, // Sunday - slowest
      1: 0.1, // Monday - slow
      2: 0.16, // Tuesday - good
      3: 0.16, // Wednesday - good
      4: 0.12, // Thursday - slow
      5: 0.18, // Friday - good
      6: 0.2, // Saturday - best
    };

    // Group transactions by day and redistribute
    const transactionsByDay = {};
    for (let day = 1; day <= 31; day++) {
      const date = new Date(2025, 7, day); // August
      const dayOfWeek = date.getDay();
      transactionsByDay[day] = {
        date: date,
        dayOfWeek: dayOfWeek,
        dayName: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ][dayOfWeek],
        multiplier: dayMultipliers[dayOfWeek],
        expectedCount: Math.round(
          ((augustTransactions.length * dayMultipliers[dayOfWeek]) / 31) * 7
        ),
        transactions: [],
      };
    }

    // Redistribute transactions according to patterns
    const shuffledTransactions = [...augustTransactions];

    // Fisher-Yates shuffle
    for (let i = shuffledTransactions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledTransactions[i], shuffledTransactions[j]] = [
        shuffledTransactions[j],
        shuffledTransactions[i],
      ];
    }

    // Assign to days based on expected counts
    let transactionIndex = 0;
    for (let day = 1; day <= 31; day++) {
      const dayInfo = transactionsByDay[day];
      const count = dayInfo.expectedCount;

      for (
        let i = 0;
        i < count && transactionIndex < shuffledTransactions.length;
        i++
      ) {
        dayInfo.transactions.push(shuffledTransactions[transactionIndex]);
        transactionIndex++;
      }
    }

    // Handle any remaining transactions
    while (transactionIndex < shuffledTransactions.length) {
      const randomDay = Math.floor(Math.random() * 31) + 1;
      transactionsByDay[randomDay].transactions.push(
        shuffledTransactions[transactionIndex]
      );
      transactionIndex++;
    }

    console.log("\n📅 August distribution after pattern application:");
    const weekSummary = {};
    Object.values(transactionsByDay).forEach((day) => {
      if (!weekSummary[day.dayName])
        weekSummary[day.dayName] = { count: 0, total: 0 };
      weekSummary[day.dayName].count++;
      weekSummary[day.dayName].total += day.transactions.length;
    });

    Object.entries(weekSummary).forEach(([dayName, data]) => {
      const avg = Math.round(data.total / data.count);
      const percentage = (
        (data.total / augustTransactions.length) *
        100
      ).toFixed(1);
      console.log(
        `${dayName}: ${avg} avg/day, ${data.total} total (${percentage}%)`
      );
    });

    // Step 3: Update timestamps with realistic business hours
    console.log("\n⏰ Updating timestamps with realistic business hours...");

    const updates = [];

    Object.values(transactionsByDay).forEach((dayInfo) => {
      dayInfo.transactions.forEach((transaction) => {
        // Business hours: 6 AM to 11 PM with peak patterns
        const businessStart = 6;
        const businessEnd = 23;

        // Peak hours: 7-9 AM, 12-2 PM, 5-8 PM
        let hour;
        const rand = Math.random();

        if (rand < 0.3) {
          // Peak morning (7-9 AM)
          hour = 7 + Math.random() * 2;
        } else if (rand < 0.5) {
          // Peak lunch (12-2 PM)
          hour = 12 + Math.random() * 2;
        } else if (rand < 0.7) {
          // Peak evening (5-8 PM)
          hour = 17 + Math.random() * 3;
        } else {
          // Regular hours
          hour = businessStart + Math.random() * (businessEnd - businessStart);
        }

        const finalHour = Math.floor(hour);
        const minutes = Math.floor(Math.random() * 60);
        const seconds = Math.floor(Math.random() * 60);
        const milliseconds = Math.floor(Math.random() * 1000);

        const newTimestamp = new Date(dayInfo.date);
        newTimestamp.setHours(finalHour, minutes, seconds, milliseconds);

        updates.push({
          updateOne: {
            filter: { _id: transaction._id },
            update: {
              $set: {
                timestamp: newTimestamp,
              },
            },
          },
        });
      });
    });

    if (updates.length > 0) {
      const updateResult = await collection.bulkWrite(updates);
      console.log(
        `✅ Updated ${updateResult.modifiedCount} transaction timestamps`
      );
    }

    // Step 4: Fix payment amounts and structures
    console.log("\n💳 Fixing payment amounts and structures...");

    const paymentUpdates = [];

    for (const transaction of augustTransactions) {
      const fixes = {};

      // Ensure paymentBreakdown exists and matches totals
      if (
        !transaction.paymentBreakdown ||
        !Array.isArray(transaction.paymentBreakdown)
      ) {
        if (transaction.paymentMethod === "cash") {
          fixes.paymentBreakdown = [
            { method: "cash", amount: transaction.total },
          ];
        } else if (transaction.paymentMethod === "card") {
          fixes.paymentBreakdown = [
            { method: "card", amount: transaction.total },
          ];
        } else if (transaction.paymentMethod === "mixed") {
          const cashAmount =
            transaction.cashAmount ||
            Math.round(transaction.total * 0.7 * 100) / 100;
          const cardAmount =
            Math.round((transaction.total - cashAmount) * 100) / 100;
          fixes.paymentBreakdown = [
            { method: "cash", amount: cashAmount },
            { method: "card", amount: cardAmount },
          ];
        }
      } else {
        // Verify existing paymentBreakdown totals
        const breakdownTotal = transaction.paymentBreakdown.reduce(
          (sum, payment) => sum + (payment.amount || 0),
          0
        );
        const totalDiff = Math.abs(breakdownTotal - transaction.total);

        if (totalDiff > 0.02) {
          // More than 2 cents difference
          console.log(
            `Fixing payment breakdown for transaction ${
              transaction.transactionId
            }: $${breakdownTotal.toFixed(2)} → $${transaction.total.toFixed(2)}`
          );

          if (transaction.paymentMethod === "cash") {
            fixes.paymentBreakdown = [
              { method: "cash", amount: transaction.total },
            ];
          } else if (transaction.paymentMethod === "card") {
            fixes.paymentBreakdown = [
              { method: "card", amount: transaction.total },
            ];
          } else if (transaction.paymentMethod === "mixed") {
            const ratio =
              transaction.paymentBreakdown.length > 0
                ? transaction.paymentBreakdown[0].amount / breakdownTotal
                : 0.7;
            const cashAmount =
              Math.round(transaction.total * ratio * 100) / 100;
            const cardAmount =
              Math.round((transaction.total - cashAmount) * 100) / 100;
            fixes.paymentBreakdown = [
              { method: "cash", amount: cashAmount },
              { method: "card", amount: cardAmount },
            ];
          }
        }
      }

      // Set unpaid to 0 and ensure change is 0
      fixes.unpaid = 0;
      fixes.change = 0;

      // Update cash/card amounts to match paymentBreakdown
      if (fixes.paymentBreakdown) {
        const cashPayment = fixes.paymentBreakdown.find(
          (p) => p.method === "cash"
        );
        const cardPayment = fixes.paymentBreakdown.find(
          (p) => p.method === "card"
        );

        fixes.cashAmount = cashPayment ? cashPayment.amount : 0;
        fixes.cardAmount = cardPayment ? cardPayment.amount : 0;
      }

      if (Object.keys(fixes).length > 0) {
        paymentUpdates.push({
          updateOne: {
            filter: { _id: transaction._id },
            update: { $set: fixes },
          },
        });
      }
    }

    if (paymentUpdates.length > 0) {
      const paymentResult = await collection.bulkWrite(paymentUpdates);
      console.log(
        `✅ Fixed payment structures for ${paymentResult.modifiedCount} transactions`
      );
    }

    // Step 5: Final verification
    console.log("\n📊 Final verification of August alcohol sales...");

    const finalStats = await collection
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

    if (finalStats.length > 0) {
      const stats = finalStats[0];
      console.log(`Total Alcohol Sales: $${stats.totalSales.toFixed(2)}`);
      console.log(`Total Transactions: ${stats.totalTransactions}`);
      console.log(`Average Transaction: $${stats.avgTransaction.toFixed(2)}`);
      console.log(`Total Unpaid: $${stats.totalUnpaid.toFixed(2)}`);
      console.log(
        `Cash Total: $${stats.totalCash.toFixed(2)} (${(
          (stats.totalCash / stats.totalSales) *
          100
        ).toFixed(1)}%)`
      );
      console.log(
        `Card Total: $${stats.totalCard.toFixed(2)} (${(
          (stats.totalCard / stats.totalSales) *
          100
        ).toFixed(1)}%)`
      );
    }

    // Payment method distribution
    const paymentDistribution = await collection
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
          },
        },
      ])
      .toArray();

    console.log(`\n💳 Payment method distribution:`);
    paymentDistribution.forEach((method) => {
      const percentage = (
        (method.count / augustTransactions.length) *
        100
      ).toFixed(1);
      console.log(
        `${method._id}: ${
          method.count
        } transactions (${percentage}%) - $${method.totalAmount.toFixed(2)}`
      );
    });

    console.log(`\n✅ August 2025 alcohol sales enhancement completed!`);
    console.log(
      `🎯 Target: $11,550 | Actual: $${finalStats[0]?.totalSales.toFixed(2)}`
    );
    console.log(
      `📊 ${augustTransactions.length} transactions with realistic business patterns`
    );
  } catch (error) {
    console.error("Error enhancing August alcohol sales:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

enhanceAugustAlcoholSales();
