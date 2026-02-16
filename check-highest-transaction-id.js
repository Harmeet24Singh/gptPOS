const { MongoClient } = require("mongodb");
require("dotenv").config();

async function checkHighestTransactionId() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB);

    const highest = await db
      .collection("transactions")
      .findOne(
        { transactionId: { $exists: true } },
        { sort: { transactionId: -1 } },
      );

    console.log(
      `Highest transaction ID: ${highest?.transactionId || "None found"}`,
    );

    // Also check if January 2026 data exists
    const januaryData = await db
      .collection("transactions")
      .find({
        timestamp: {
          $gte: new Date("2026-01-01"),
          $lt: new Date("2026-02-01"),
        },
      })
      .toArray();

    console.log(`Existing January 2026 transactions: ${januaryData.length}`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

checkHighestTransactionId();
