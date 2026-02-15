const { MongoClient } = require("mongodb");
require("dotenv").config();

async function findDecemberAlcohol() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
  const dbName = process.env.MONGO_DB || "convenience_store";

  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db(dbName);

  // Find alcohol transactions with cashier "December-Sales"
  const alcoholTransactions = await db
    .collection("transactions")
    .find({
      cashier: "December-Sales",
    })
    .limit(5)
    .toArray();

  console.log("December-Sales transactions:");
  alcoholTransactions.forEach((t, i) => {
    console.log(`${i + 1}. Timestamp: ${t.timestamp}`);
    console.log(`   Type: ${typeof t.timestamp}`);
    console.log(
      `   ISO: ${t.timestamp instanceof Date ? t.timestamp.toISOString() : t.timestamp}`,
    );
    console.log(
      `   Items: ${t.items.map((item) => `${item.name} (${item.category})`).join(", ")}`,
    );
    console.log("");
  });

  // Check if they're in December range
  const decemberStart = new Date("2025-12-01T00:00:00.000Z");
  const decemberEnd = new Date("2026-01-01T00:00:00.000Z");

  console.log("December range check:");
  alcoholTransactions.forEach((t, i) => {
    const timestamp = new Date(t.timestamp);
    const inRange = timestamp >= decemberStart && timestamp < decemberEnd;
    console.log(
      `${i + 1}. ${timestamp.toISOString()} - In December? ${inRange}`,
    );
  });

  await client.close();
}

findDecemberAlcohol().catch(console.error);
