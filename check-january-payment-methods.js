const { MongoClient } = require("mongodb");
require("dotenv").config();

async function checkJanuaryPaymentMethods() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB);

    // Get January alcohol transactions
    const januaryAlcohol = await db
      .collection("transactions")
      .find({
        timestamp: {
          $gte: new Date("2026-01-01"),
          $lt: new Date("2026-02-01"),
        },
        "items.category": "Alcohol",
      })
      .limit(10)
      .toArray();

    console.log("🔍 Checking January Alcohol Payment Methods\n");
    console.log(`Found ${januaryAlcohol.length} sample transactions:\n`);

    januaryAlcohol.forEach((transaction, index) => {
      console.log(`${index + 1}. Transaction ID: ${transaction.transactionId}`);
      console.log(
        `   Payment Method: ${transaction.paymentMethod || "MISSING"}`,
      );
      console.log(`   Cash Amount: ${transaction.cashAmount || "MISSING"}`);
      console.log(`   Card Amount: ${transaction.cardAmount || "MISSING"}`);
      console.log(`   Total: $${transaction.total}`);
      console.log(`   Timestamp: ${transaction.timestamp}`);
      console.log("");
    });

    // Count payment methods
    const allJanAlcohol = await db
      .collection("transactions")
      .find({
        timestamp: {
          $gte: new Date("2026-01-01"),
          $lt: new Date("2026-02-01"),
        },
        "items.category": "Alcohol",
      })
      .toArray();

    const paymentBreakdown = {
      cash: 0,
      card: 0,
      missing: 0,
      unknown: 0,
    };

    allJanAlcohol.forEach((transaction) => {
      if (!transaction.paymentMethod) {
        paymentBreakdown.missing++;
      } else if (transaction.paymentMethod === "unknown") {
        paymentBreakdown.unknown++;
      } else if (transaction.paymentMethod === "cash") {
        paymentBreakdown.cash++;
      } else if (transaction.paymentMethod === "card") {
        paymentBreakdown.card++;
      }
    });

    console.log(`📊 Payment Method Breakdown (${allJanAlcohol.length} total):`);
    console.log(`   Cash: ${paymentBreakdown.cash}`);
    console.log(`   Card: ${paymentBreakdown.card}`);
    console.log(`   Missing: ${paymentBreakdown.missing}`);
    console.log(`   Unknown: ${paymentBreakdown.unknown}`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

checkJanuaryPaymentMethods();
