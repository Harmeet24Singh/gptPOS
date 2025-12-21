const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function shuffleTransactionOrder() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Get ALL July transactions
    const julyTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
      })
      .sort({ transactionId: 1 })
      .toArray();

    console.log(
      `\n📋 Found ${julyTransactions.length} July transactions to shuffle`
    );

    // Create array of payment methods in current order
    const paymentMethods = julyTransactions.map((t) => ({
      paymentMethod: t.paymentMethod,
      paymentBreakdown: t.paymentBreakdown,
      cashAmount: t.cashAmount,
      cardAmount: t.cardAmount,
      cashback: t.cashback || 0,
    }));

    // Shuffle the payment methods array using Fisher-Yates algorithm
    for (let i = paymentMethods.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [paymentMethods[i], paymentMethods[j]] = [
        paymentMethods[j],
        paymentMethods[i],
      ];
    }

    console.log(`\n🔀 Payment methods shuffled randomly`);

    // Apply shuffled payment methods to transactions
    let updateCount = 0;

    for (let i = 0; i < julyTransactions.length; i++) {
      const transaction = julyTransactions[i];
      const newPaymentData = paymentMethods[i];

      const updateResult = await collection.updateOne(
        { _id: transaction._id },
        {
          $set: {
            paymentMethod: newPaymentData.paymentMethod,
            paymentBreakdown: newPaymentData.paymentBreakdown,
            cashAmount: newPaymentData.cashAmount,
            cardAmount: newPaymentData.cardAmount,
            cashback: newPaymentData.cashback,
          },
        }
      );

      if (updateResult.modifiedCount > 0) {
        updateCount++;
        if (updateCount % 50 === 0) {
          console.log(
            `Shuffled ${updateCount}/${julyTransactions.length} transactions...`
          );
        }
      }
    }

    console.log(
      `\n✅ Successfully shuffled ${updateCount} July transaction payment methods`
    );

    // Verify the shuffle by checking first and last 20 transactions
    console.log(`\n🔍 First 20 transactions after shuffle:`);
    const firstShuffled = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
      })
      .sort({ transactionId: 1 })
      .limit(20)
      .toArray();

    firstShuffled.forEach((t, idx) => {
      console.log(
        `${(idx + 1).toString().padStart(2)}: ${
          t.transactionId
        } - ${t.paymentMethod.padEnd(6)} - $${t.total.toFixed(2)}`
      );
    });

    // Show new distribution in first 50
    const newFirst50 = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
      })
      .sort({ transactionId: 1 })
      .limit(50)
      .toArray();

    const newFirstDistribution = newFirst50.reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + 1;
      return acc;
    }, {});

    console.log(
      `\n📊 Payment method distribution in first 50 transactions (after shuffle):`
    );
    Object.entries(newFirstDistribution).forEach(([method, count]) => {
      console.log(
        `${method}: ${count} transactions (${((count / 50) * 100).toFixed(1)}%)`
      );
    });
  } catch (error) {
    console.error("Error shuffling transactions:", error);
  } finally {
    await client.close();
    console.log("\nConnection closed");
  }
}

shuffleTransactionOrder();
