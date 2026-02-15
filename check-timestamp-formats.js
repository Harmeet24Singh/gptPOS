const { MongoClient } = require("mongodb");

async function checkTimestampFormats() {
  const client = new MongoClient("mongodb://localhost:27017");
  await client.connect();

  const db = client.db("convenience_store");

  // Get some sample alcohol transactions
  const samples = await db
    .collection("transactions")
    .find({
      "items.category": "Alcohol",
    })
    .limit(3)
    .toArray();

  console.log("Sample alcohol transactions:");
  samples.forEach((t, i) => {
    console.log(`${i + 1}. Timestamp: ${t.timestamp}`);
    console.log(`   Type: ${typeof t.timestamp}`);
    console.log(`   Constructor: ${t.timestamp.constructor.name}`);
    console.log(
      `   ISO String: ${t.timestamp instanceof Date ? t.timestamp.toISOString() : "Not a Date"}`,
    );
    console.log(`   Cashier: ${t.cashier}`);
    console.log(
      `   Items: ${t.items.filter((item) => item.category === "Alcohol").map((item) => item.name)}`,
    );
    console.log("");
  });

  // Try to find them with different query formats
  const testQueries = [
    // Test as Date objects
    {
      timestamp: {
        $gte: new Date("2025-12-01T00:00:00.000Z"),
        $lt: new Date("2026-01-01T00:00:00.000Z"),
      },
    },
    // Test as strings
    {
      timestamp: {
        $gte: "2025-12-01T00:00:00.000Z",
        $lt: "2026-01-01T00:00:00.000Z",
      },
    },
    // Test regex for year 2025
    { timestamp: { $regex: /^2025/ } },
  ];

  for (let i = 0; i < testQueries.length; i++) {
    const count = await db
      .collection("transactions")
      .countDocuments(testQueries[i]);
    console.log(
      `Query ${i + 1} (${Object.keys(testQueries[i])[0]}): ${count} results`,
    );
  }

  await client.close();
}

checkTimestampFormats().catch(console.error);
