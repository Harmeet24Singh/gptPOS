const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function checkOctoberAlcoholPaymentMethods() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Find October 2025 alcohol transactions
    const query = {
      timestamp: {
        $gte: new Date("2025-10-01T00:00:00.000Z"),
        $lt: new Date("2025-11-01T00:00:00.000Z"),
      },
      "items.category": "Alcohol",
    };

    const transactions = await collection.find(query).toArray();
    console.log(`Found ${transactions.length} October alcohol transactions`);

    // Check payment method distribution
    const paymentMethodStats = {};
    const missingPaymentMethods = [];

    transactions.forEach((transaction) => {
      if (transaction.paymentMethod) {
        paymentMethodStats[transaction.paymentMethod] =
          (paymentMethodStats[transaction.paymentMethod] || 0) + 1;
      } else {
        missingPaymentMethods.push(
          transaction.transactionId || transaction._id
        );
      }
    });

    console.log("\n💳 Current payment method distribution:");
    Object.entries(paymentMethodStats).forEach(([method, count]) => {
      const percentage = ((count / transactions.length) * 100).toFixed(1);
      console.log(`${method}: ${count} transactions (${percentage}%)`);
    });

    if (missingPaymentMethods.length > 0) {
      console.log(
        `\n⚠️  ${missingPaymentMethods.length} transactions missing payment methods:`
      );
      console.log(missingPaymentMethods.slice(0, 10)); // Show first 10
    } else {
      console.log("\n✅ All transactions have payment methods assigned");
    }

    // Show a sample transaction
    if (transactions.length > 0) {
      console.log("\n📄 Sample transaction:");
      const sample = transactions[0];
      console.log({
        transactionId: sample.transactionId,
        timestamp: sample.timestamp,
        total: sample.total,
        paymentMethod: sample.paymentMethod,
        itemCount: sample.items?.length || 0,
      });
    }
  } catch (error) {
    console.error("Error checking October alcohol payment methods:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

// Run the check script
checkOctoberAlcoholPaymentMethods();
