const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function updateCreditToCard() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Find July transactions with credit payments
    const julyTransactions = await collection.find({
      timestamp: {
        $gte: new Date("2025-07-01T00:00:00.000Z"),
        $lt: new Date("2025-08-01T00:00:00.000Z"),
      },
      $or: [
        { paymentMethod: "credit" },
        { paymentMethod: "debit" },
        { "paymentBreakdown.method": "credit" },
        { "paymentBreakdown.method": "debit" }
      ]
    }).toArray();

    console.log(`\n📋 Found ${julyTransactions.length} July transactions with credit/debit payments to update`);

    let updateCount = 0;

    for (const transaction of julyTransactions) {
      let needsUpdate = false;
      let newPaymentMethod = transaction.paymentMethod;
      let newPaymentBreakdown = [...transaction.paymentBreakdown];

      // Update paymentMethod field
      if (transaction.paymentMethod === "credit" || transaction.paymentMethod === "debit") {
        newPaymentMethod = "card";
        needsUpdate = true;
      }

      // Update paymentBreakdown array
      newPaymentBreakdown = newPaymentBreakdown.map(payment => {
        if (payment.method === "credit" || payment.method === "debit") {
          needsUpdate = true;
          return { ...payment, method: "card" };
        }
        return payment;
      });

      if (needsUpdate) {
        const updateResult = await collection.updateOne(
          { _id: transaction._id },
          {
            $set: {
              paymentMethod: newPaymentMethod,
              paymentBreakdown: newPaymentBreakdown
            }
          }
        );

        if (updateResult.modifiedCount > 0) {
          updateCount++;
          if (updateCount % 50 === 0) {
            console.log(`Updated ${updateCount} transactions...`);
          }
        }
      }
    }

    console.log(`\n✅ Successfully updated ${updateCount} July transactions (credit/debit → card)`);
    
    // Verify the update by checking payment method distribution
    const paymentStats = await collection.aggregate([
      {
        $match: {
          timestamp: {
            $gte: new Date("2025-07-01T00:00:00.000Z"),
            $lt: new Date("2025-08-01T00:00:00.000Z"),
          }
        }
      },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();

    console.log(`\n📊 Payment method distribution after update:`);
    paymentStats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} transactions`);
    });

    // Check sample transactions
    const sampleTransactions = await collection.find({
      timestamp: {
        $gte: new Date("2025-07-01T00:00:00.000Z"),
        $lt: new Date("2025-08-01T00:00:00.000Z"),
      },
      paymentMethod: "card"
    }).limit(3).toArray();

    console.log(`\n🔍 Sample card transactions:`);
    sampleTransactions.forEach((t, idx) => {
      console.log(`${idx + 1}. ID: ${t.transactionId}, Method: ${t.paymentMethod}, Total: $${t.total}`);
      console.log(`   PaymentBreakdown:`, t.paymentBreakdown);
    });

  } catch (error) {
    console.error("Error updating credit to card:", error);
  } finally {
    await client.close();
    console.log("\nConnection closed");
  }
}

updateCreditToCard();