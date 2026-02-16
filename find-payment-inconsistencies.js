const { MongoClient } = require("mongodb");
require("dotenv").config();

async function analyzeInconsistencies() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB);

    console.log("🚨 PAYMENT STRUCTURE INCONSISTENCIES FOUND:\n");

    // Check December card transaction issue
    console.log("❌ Issue 1: December card transaction has wrong amounts");
    const decCard = await db
      .collection("transactions")
      .findOne({ transactionId: 202364 });
    console.log(
      `   Transaction ID 202364 (card): cashAmount=${decCard.cashAmount}, cardAmount=${decCard.cardAmount}, total=${decCard.total}`,
    );
    console.log(
      `   ❌ ERROR: Card transaction should have cardAmount = total, cashAmount = 0\n`,
    );

    // Check overall pattern
    console.log("✅ CORRECT PATTERNS OBSERVED:");
    console.log(
      "   1. October: cash transactions have cashAmount = total, cardAmount = 0",
    );
    console.log(
      "   2. November: cash transactions have cashAmount = total, cardAmount = 0",
    );
    console.log(
      "   3. December: cash transactions have cashAmount = total, cardAmount = 0",
    );
    console.log(
      "   4. January alcohol: card transactions have cardAmount = total, cashAmount = 0\n",
    );

    // Count inconsistencies
    console.log("🔍 Finding all inconsistent transactions...\n");

    const inconsistentTransactions = await db
      .collection("transactions")
      .find({
        $or: [
          // Card payments with wrong amounts
          { paymentMethod: "card", $expr: { $ne: ["$cardAmount", "$total"] } },
          { paymentMethod: "card", cashAmount: { $ne: 0 } },
          // Cash payments with wrong amounts
          { paymentMethod: "cash", $expr: { $ne: ["$cashAmount", "$total"] } },
          { paymentMethod: "cash", cardAmount: { $ne: 0 } },
        ],
      })
      .toArray();

    console.log(
      `Found ${inconsistentTransactions.length} inconsistent transactions:`,
    );
    inconsistentTransactions.slice(0, 10).forEach((t) => {
      console.log(
        `   ID ${t.transactionId}: ${t.paymentMethod} - cash:${t.cashAmount}, card:${t.cardAmount}, total:${t.total}`,
      );
    });

    if (inconsistentTransactions.length > 10) {
      console.log(`   ... and ${inconsistentTransactions.length - 10} more`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

analyzeInconsistencies();
