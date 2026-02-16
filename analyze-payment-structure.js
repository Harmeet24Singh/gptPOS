const { MongoClient } = require("mongodb");
require("dotenv").config();

async function checkExistingPaymentStructure() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB);

    console.log("🔍 Analyzing Payment Method Structure Across Months\n");

    // Check sample transactions from different months
    const months = [
      {
        name: "October",
        start: new Date("2025-10-01"),
        end: new Date("2025-11-01"),
      },
      {
        name: "November",
        start: new Date("2025-11-01"),
        end: new Date("2025-12-01"),
      },
      {
        name: "December",
        start: new Date("2025-12-01"),
        end: new Date("2026-01-01"),
      },
    ];

    for (const month of months) {
      const samples = await db
        .collection("transactions")
        .find({
          timestamp: { $gte: month.start, $lt: month.end },
        })
        .limit(3)
        .toArray();

      console.log(`📅 ${month.name} Sample Transactions:`);
      samples.forEach((t, i) => {
        console.log(`   ${i + 1}. ID ${t.transactionId}:`);
        console.log(
          `      paymentMethod: ${JSON.stringify(t.paymentMethod)} (type: ${typeof t.paymentMethod})`,
        );
        console.log(
          `      cashAmount: ${JSON.stringify(t.cashAmount)} (type: ${typeof t.cashAmount})`,
        );
        console.log(
          `      cardAmount: ${JSON.stringify(t.cardAmount)} (type: ${typeof t.cardAmount})`,
        );
        console.log(
          `      creditAmount: ${JSON.stringify(t.creditAmount)} (type: ${typeof t.creditAmount})`,
        );
        console.log(`      total: $${t.total}`);
        console.log("");
      });
    }

    // Now check January alcohol transactions
    console.log("🍺 January Alcohol Transactions Structure:");
    const janAlcohol = await db
      .collection("transactions")
      .find({
        timestamp: {
          $gte: new Date("2026-01-01"),
          $lt: new Date("2026-02-01"),
        },
        "items.category": "Alcohol",
      })
      .limit(3)
      .toArray();

    janAlcohol.forEach((t, i) => {
      console.log(`   ${i + 1}. ID ${t.transactionId}:`);
      console.log(
        `      paymentMethod: ${JSON.stringify(t.paymentMethod)} (type: ${typeof t.paymentMethod})`,
      );
      console.log(
        `      cashAmount: ${JSON.stringify(t.cashAmount)} (type: ${typeof t.cashAmount})`,
      );
      console.log(
        `      cardAmount: ${JSON.stringify(t.cardAmount)} (type: ${typeof t.cardAmount})`,
      );
      console.log(
        `      creditAmount: ${JSON.stringify(t.creditAmount)} (type: ${typeof t.creditAmount})`,
      );
      console.log(`      total: $${t.total}`);
      console.log("");
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

checkExistingPaymentStructure();
