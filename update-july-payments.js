const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function updateJulyPaymentStructure() {
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
      .toArray();

    console.log(
      `\n📋 Found ${julyTransactions.length} July transactions to update`
    );

    // Calculate payment distribution
    const totalTransactions = julyTransactions.length;
    const cashCount = Math.floor(totalTransactions * 0.7); // 70% cash
    const cardCount = Math.floor(totalTransactions * 0.28); // 28% card
    const mixedCount = totalTransactions - cashCount - cardCount; // 2% mixed

    console.log(`\n💰 Payment distribution:`);
    console.log(
      `Cash only: ${cashCount} transactions (${(
        (cashCount / totalTransactions) *
        100
      ).toFixed(1)}%)`
    );
    console.log(
      `Card only: ${cardCount} transactions (${(
        (cardCount / totalTransactions) *
        100
      ).toFixed(1)}%)`
    );
    console.log(
      `Mixed: ${mixedCount} transactions (${(
        (mixedCount / totalTransactions) *
        100
      ).toFixed(1)}%)`
    );

    let updateCount = 0;

    for (let i = 0; i < julyTransactions.length; i++) {
      const transaction = julyTransactions[i];
      let paymentBreakdown = [];
      let paymentMethod = "";
      let cashAmount = 0;
      let cardAmount = 0;
      let cashback = 0;

      if (i < cashCount) {
        // 70% - Cash only transactions
        paymentMethod = "cash";
        cashAmount = transaction.total;
        cardAmount = 0;
        paymentBreakdown = [{ method: "cash", amount: transaction.total }];
      } else if (i < cashCount + cardCount) {
        // 28% - Card only transactions
        const cardType = Math.random() > 0.5 ? "debit" : "credit";
        paymentMethod = cardType;
        cashAmount = 0;
        cardAmount = transaction.total;
        paymentBreakdown = [{ method: cardType, amount: transaction.total }];
      } else {
        // 2% - Mixed payment transactions
        // Split randomly between cash and card (60-90% cash, rest card)
        const cashPercentage = 0.6 + Math.random() * 0.3; // 60-90%
        const cashPortion =
          Math.round(transaction.total * cashPercentage * 100) / 100;
        const cardPortion =
          Math.round((transaction.total - cashPortion) * 100) / 100;

        paymentMethod = "mixed";
        cashAmount = cashPortion;
        cardAmount = cardPortion;

        const cardType = Math.random() > 0.5 ? "debit" : "credit";
        paymentBreakdown = [
          { method: "cash", amount: cashPortion },
          { method: cardType, amount: cardPortion },
        ];
      }

      // Update the transaction with new payment structure
      const updateResult = await collection.updateOne(
        { _id: transaction._id },
        {
          $set: {
            paymentBreakdown: paymentBreakdown,
            paymentMethod: paymentMethod,
            cashAmount: cashAmount,
            cardAmount: cardAmount,
            cashback: cashback,
          },
          $unset: {
            // Remove any old single payment method fields if they exist differently
          },
        }
      );

      if (updateResult.modifiedCount > 0) {
        updateCount++;
        if (updateCount % 50 === 0) {
          console.log(
            `Updated ${updateCount}/${julyTransactions.length} transactions...`
          );
        }
      }
    }

    console.log(
      `\n✅ Successfully updated ${updateCount} July transactions with new payment structure`
    );

    // Verify the update by checking a few samples
    const updatedSamples = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
      })
      .limit(3)
      .toArray();

    console.log(`\n🔍 Sample updated transactions:`);
    updatedSamples.forEach((t, idx) => {
      console.log(
        `${idx + 1}. ID: ${t.transactionId}, Method: ${
          t.paymentMethod
        }, Total: $${t.total}`
      );
      console.log(`   PaymentBreakdown:`, t.paymentBreakdown);
      console.log(`   Cash: $${t.cashAmount}, Card: $${t.cardAmount}`);
    });
  } catch (error) {
    console.error("Error updating July payment structure:", error);
  } finally {
    await client.close();
    console.log("\nConnection closed");
  }
}

updateJulyPaymentStructure();
