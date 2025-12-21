require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function analyzeExcludedTransactions() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("convenience_store");
    const collection = db.collection("transactions");

    console.log("🔍 Analyzing the first 39 excluded transactions\n");

    const allJulyGrocery = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00Z"),
          $lt: new Date("2025-08-01T00:00:00Z"),
        },
        "items.category": "Grocery",
      })
      .sort({ timestamp: 1 })
      .toArray(); // Sort by timestamp ascending

    console.log(`📊 Total July grocery transactions: ${allJulyGrocery.length}`);

    // Show the first 39 transactions that are being excluded
    const excludedTransactions = allJulyGrocery.slice(0, 39);
    const remainingTransactions = allJulyGrocery.slice(39);

    console.log("\n🚫 EXCLUDED transactions (first 39):");
    console.log(
      "Date Range:",
      new Date(excludedTransactions[0].timestamp).toISOString().split("T")[0],
      "to",
      new Date(excludedTransactions[excludedTransactions.length - 1].timestamp)
        .toISOString()
        .split("T")[0]
    );

    const excludedTotal = excludedTransactions.reduce(
      (sum, t) => sum + t.total,
      0
    );
    const remainingTotal = remainingTransactions.reduce(
      (sum, t) => sum + t.total,
      0
    );

    console.log(`Excluded total: $${excludedTotal.toFixed(2)}`);
    console.log(
      `Remaining total: $${remainingTotal.toFixed(
        2
      )} (this matches your $6,175.26!)`
    );

    console.log("\n📅 First few excluded transactions:");
    excludedTransactions.slice(0, 10).forEach((t) => {
      const date = new Date(t.timestamp);
      console.log(
        `- ${t.transactionId}: ${date.toISOString().split("T")[0]} ${
          date.toTimeString().split(" ")[0]
        } - $${t.total}`
      );
    });

    console.log("\n📅 Last few excluded transactions:");
    excludedTransactions.slice(-5).forEach((t) => {
      const date = new Date(t.timestamp);
      console.log(
        `- ${t.transactionId}: ${date.toISOString().split("T")[0]} ${
          date.toTimeString().split(" ")[0]
        } - $${t.total}`
      );
    });

    console.log("\n✅ First few included transactions:");
    remainingTransactions.slice(0, 5).forEach((t) => {
      const date = new Date(t.timestamp);
      console.log(
        `- ${t.transactionId}: ${date.toISOString().split("T")[0]} ${
          date.toTimeString().split(" ")[0]
        } - $${t.total}`
      );
    });

    // Check if there's a pattern in the exclusion
    console.log("\n🔍 Analyzing exclusion patterns:");

    // Check dates
    const excludedDates = excludedTransactions.map(
      (t) => new Date(t.timestamp).toISOString().split("T")[0]
    );
    const uniqueExcludedDates = [...new Set(excludedDates)];

    console.log(
      `Excluded date range: ${uniqueExcludedDates[0]} to ${
        uniqueExcludedDates[uniqueExcludedDates.length - 1]
      }`
    );
    console.log(`Number of days excluded: ${uniqueExcludedDates.length}`);

    // Check transaction IDs
    const excludedIds = excludedTransactions.map((t) => t.transactionId).sort();
    const includedIds = remainingTransactions
      .slice(0, 10)
      .map((t) => t.transactionId)
      .sort();

    console.log(`\nTransaction ID patterns:`);
    console.log(
      `Excluded IDs range: ${excludedIds[0]} to ${
        excludedIds[excludedIds.length - 1]
      }`
    );
    console.log(`Included IDs start: ${includedIds[0]} (first 10 shown)`);

    // Check if frontend might be using a limit or skip
    console.log(
      `\n🎯 DIAGNOSIS: Frontend appears to be using skip(39) or similar pagination`
    );
    console.log(`This suggests either:`);
    console.log(`1. Frontend pagination is skipping first page`);
    console.log(`2. Query limit is cutting off results`);
    console.log(`3. Date filtering is slightly off`);
    console.log(`4. Transaction ordering is different`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("\n🔌 Connection closed");
  }
}

analyzeExcludedTransactions();
