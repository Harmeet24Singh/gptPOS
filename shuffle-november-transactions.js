const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function shuffleNovemberTransactions() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    const BASE_TRANSACTION_ID = 110800;

    console.log(
      "\n🔀 Shuffling November 2025 grocery transactions for realistic ordering..."
    );

    // Get all November grocery transactions
    const novemberTransactions = await collection
      .find({
        transactionId: {
          $gte: BASE_TRANSACTION_ID,
          $lt: BASE_TRANSACTION_ID + 1000,
        },
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
      })
      .sort({ timestamp: 1 })
      .toArray();

    console.log(
      `📊 Found ${novemberTransactions.length} November grocery transactions`
    );

    // Analyze current payment distribution
    const paymentBreakdown = novemberTransactions.reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + 1;
      return acc;
    }, {});

    console.log(`\n💳 Current Payment Distribution:`);
    Object.entries(paymentBreakdown).forEach(([method, count]) => {
      const percentage = ((count / novemberTransactions.length) * 100).toFixed(
        1
      );
      console.log(`   ${method}: ${count} (${percentage}%)`);
    });

    // Group transactions by day for realistic shuffling
    const transactionsByDay = {};
    novemberTransactions.forEach((transaction) => {
      const day = new Date(transaction.timestamp).getDate();
      if (!transactionsByDay[day]) {
        transactionsByDay[day] = [];
      }
      transactionsByDay[day].push(transaction);
    });

    // Shuffle each day's transactions
    const shuffledTransactions = [];
    for (const day in transactionsByDay) {
      const dayTransactions = transactionsByDay[day];

      // Shuffle the transactions for this day using Fisher-Yates algorithm
      for (let i = dayTransactions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dayTransactions[i], dayTransactions[j]] = [
          dayTransactions[j],
          dayTransactions[i],
        ];
      }

      // Assign new realistic times throughout the day
      dayTransactions.forEach((transaction, index) => {
        // Distribute transactions more evenly throughout business hours (7 AM - 9 PM)
        const totalHours = 14; // 7 AM to 9 PM = 14 hours
        const hourInterval = totalHours / dayTransactions.length;
        const baseHour = 7 + index * hourInterval;
        const hour = Math.floor(baseHour) + Math.floor(Math.random() * 2); // Add some randomness
        const minute = Math.floor(Math.random() * 60);

        // Ensure hour stays within business hours
        const finalHour = Math.max(7, Math.min(21, hour));

        transaction.timestamp = new Date(
          2025,
          10,
          parseInt(day),
          finalHour,
          minute
        );
        transaction.createdAt = transaction.timestamp;
      });

      shuffledTransactions.push(...dayTransactions);
    }

    // Sort by new timestamp to maintain chronological order
    shuffledTransactions.sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    console.log(
      `\n🔄 Shuffled ${shuffledTransactions.length} transactions with realistic timing`
    );

    // Update all transactions with new timestamps
    const updateOperations = shuffledTransactions.map((transaction) => ({
      updateOne: {
        filter: { _id: transaction._id },
        update: {
          $set: {
            timestamp: transaction.timestamp,
            createdAt: transaction.createdAt,
          },
        },
      },
    }));

    if (updateOperations.length > 0) {
      const result = await collection.bulkWrite(updateOperations);
      console.log(`✅ Updated ${result.modifiedCount} transaction timestamps`);
    }

    // Verify the shuffle worked
    const verifyTransactions = await collection
      .find({
        transactionId: {
          $gte: BASE_TRANSACTION_ID,
          $lt: BASE_TRANSACTION_ID + 1000,
        },
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
      })
      .sort({ timestamp: 1 })
      .toArray();

    console.log(`\n📊 Verification - Chronological order sample (first 10):`);
    verifyTransactions.slice(0, 10).forEach((t, index) => {
      const date = new Date(t.timestamp);
      const timeStr = date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      console.log(
        `   ${index + 1}. ${timeStr} - ${t.paymentMethod} - $${t.total.toFixed(
          2
        )} (ID: ${t.transactionId})`
      );
    });

    // Check payment method distribution remains the same
    const newPaymentBreakdown = verifyTransactions.reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + 1;
      return acc;
    }, {});

    console.log(`\n💳 Verified Payment Distribution (unchanged):`);
    Object.entries(newPaymentBreakdown).forEach(([method, count]) => {
      const percentage = ((count / verifyTransactions.length) * 100).toFixed(1);
      console.log(`   ${method}: ${count} (${percentage}%)`);
    });

    const totalAmount = verifyTransactions.reduce((sum, t) => sum + t.total, 0);
    console.log(`\n💰 Total amount unchanged: $${totalAmount.toFixed(2)}`);
    console.log(
      `✅ November 2025 grocery transactions successfully shuffled for realistic ordering!`
    );
  } catch (error) {
    console.error("Error shuffling November transactions:", error);
  } finally {
    await client.close();
  }
}

shuffleNovemberTransactions();
