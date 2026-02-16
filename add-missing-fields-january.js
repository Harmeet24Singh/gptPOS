const { MongoClient } = require("mongodb");
require("dotenv").config();

async function addMissingFieldsToJanuary() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB);

    console.log("🔧 ADDING MISSING FIELDS TO JANUARY ALCOHOL TRANSACTIONS\n");

    // Update January alcohol transactions to match July structure exactly
    const result = await db.collection("transactions").updateMany(
      {
        timestamp: {
          $gte: new Date("2026-01-01"),
          $lt: new Date("2026-02-01"),
        },
        "items.category": "Alcohol",
      },
      [
        {
          $set: {
            cashier: "system",
            store: "Main Store",
            cashback: 0,
            paymentBreakdown: [
              {
                method: "$paymentMethod",
                amount: "$total",
              },
            ],
          },
        },
      ],
    );

    console.log(
      `✅ Updated ${result.modifiedCount} January alcohol transactions\n`,
    );

    // Verify the update
    console.log("🔍 Verification - Sample January Alcohol Transaction:");
    const sample = await db.collection("transactions").findOne({
      timestamp: { $gte: new Date("2026-01-01"), $lt: new Date("2026-02-01") },
      "items.category": "Alcohol",
    });

    console.log(JSON.stringify(sample, null, 2));

    console.log("\n🎯 Should now match July transaction structure exactly!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

addMissingFieldsToJanuary();
