const { MongoClient } = require("mongodb");
require("dotenv").config();

async function checkJulyPaymentStructure() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB);

    console.log("🔍 CHECKING JULY TRANSACTION PAYMENT STRUCTURE\n");

    // Get sample July transactions
    const julyTransactions = await db
      .collection("transactions")
      .find({
        timestamp: {
          $gte: new Date("2025-07-01"),
          $lt: new Date("2025-08-01"),
        },
      })
      .limit(10)
      .toArray();

    console.log("📅 July Transaction Payment Structure:");
    julyTransactions.forEach((t, i) => {
      console.log(`${i + 1}. Transaction ID: ${t.transactionId}`);
      console.log(
        `   paymentMethod: ${JSON.stringify(t.paymentMethod)} (type: ${typeof t.paymentMethod})`,
      );
      console.log(
        `   cashAmount: ${JSON.stringify(t.cashAmount)} (type: ${typeof t.cashAmount})`,
      );
      console.log(
        `   cardAmount: ${JSON.stringify(t.cardAmount)} (type: ${typeof t.cardAmount})`,
      );
      console.log(
        `   creditAmount: ${JSON.stringify(t.creditAmount)} (type: ${typeof t.creditAmount})`,
      );
      console.log(`   total: $${t.total}`);

      // Check if it has the payment field structure
      if (t.payment) {
        console.log(`   payment: ${JSON.stringify(t.payment)}`);
      }

      // Show all fields that might be payment related
      const paymentFields = Object.keys(t).filter(
        (key) =>
          key.toLowerCase().includes("payment") ||
          key.toLowerCase().includes("cash") ||
          key.toLowerCase().includes("card"),
      );
      if (paymentFields.length > 0) {
        console.log(`   Payment-related fields: ${paymentFields.join(", ")}`);
      }
      console.log("");
    });

    // Now compare with January alcohol
    console.log("🍺 JANUARY ALCOHOL PAYMENT STRUCTURE:");
    const janAlcohol = await db
      .collection("transactions")
      .find({
        timestamp: {
          $gte: new Date("2026-01-01"),
          $lt: new Date("2026-02-01"),
        },
        "items.category": "Alcohol",
      })
      .limit(5)
      .toArray();

    janAlcohol.forEach((t, i) => {
      console.log(`${i + 1}. Transaction ID: ${t.transactionId}`);
      console.log(
        `   paymentMethod: ${JSON.stringify(t.paymentMethod)} (type: ${typeof t.paymentMethod})`,
      );
      console.log(
        `   cashAmount: ${JSON.stringify(t.cashAmount)} (type: ${typeof t.cashAmount})`,
      );
      console.log(
        `   cardAmount: ${JSON.stringify(t.cardAmount)} (type: ${typeof t.cardAmount})`,
      );
      console.log(
        `   creditAmount: ${JSON.stringify(t.creditAmount)} (type: ${typeof t.creditAmount})`,
      );
      console.log(`   total: $${t.total}`);

      if (t.payment) {
        console.log(`   payment: ${JSON.stringify(t.payment)}`);
      }
      console.log("");
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

checkJulyPaymentStructure();
