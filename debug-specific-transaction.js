const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function testOctoberMonthFilter() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Simulate the exact query the frontend would make for October 2025
    const monthFilter = "2025-10"; // October 2025
    const [year, month] = monthFilter.split("-");
    const monthStart = new Date(
      parseInt(year),
      parseInt(month) - 1,
      1,
      0,
      0,
      0,
      0
    );
    const monthEnd = new Date(parseInt(year), parseInt(month), 1, 0, 0, 0, 0); // First day of next month

    console.log(`Month filter: ${monthFilter}`);
    console.log(`Date range: ${monthStart} to ${monthEnd}`);

    const dateQuery = {
      timestamp: {
        $gte: monthStart,
        $lt: monthEnd,
      },
    };

    console.log("Query:", JSON.stringify(dateQuery, null, 2));

    // Execute the exact same query as the server
    const cursor = collection.find(dateQuery).sort({ _id: -1 }).limit(1000);

    const transactions = await cursor.toArray();

    console.log(`\nResults: ${transactions.length} transactions`);

    if (transactions.length > 0) {
      let totalSales = 0;
      let alcoholCount = 0;
      let alcoholSales = 0;

      transactions.forEach((t) => {
        totalSales += t.total;

        // Check if it has alcohol items
        if (t.items && t.items.some((item) => item.category === "Alcohol")) {
          alcoholCount++;
          alcoholSales += t.total;
        }
      });

      console.log(`Total sales: $${totalSales.toFixed(2)}`);
      console.log(`Alcohol transactions: ${alcoholCount}`);
      console.log(`Alcohol sales: $${alcoholSales.toFixed(2)}`);

      console.log("\nFirst 5 transactions:");
      transactions.slice(0, 5).forEach((t, i) => {
        const hasAlcohol =
          t.items && t.items.some((item) => item.category === "Alcohol");
        console.log(
          `${i + 1}. ${t.timestamp} | $${t.total} | ${
            hasAlcohol ? "ALCOHOL" : "Other"
          }`
        );
      });

      // Check if there are any transactions that might be showing as $923.78
      let runningTotal = 0;
      let count = 0;
      for (const t of transactions) {
        runningTotal += t.total;
        count++;
        if (Math.abs(runningTotal - 923.78) < 0.01) {
          console.log(
            `\n*** FOUND: First ${count} transactions = $${runningTotal.toFixed(
              2
            )} ***`
          );
          break;
        }
        if (count === 18 && Math.abs(runningTotal - 923.78) < 1) {
          console.log(
            `\n*** CLOSE: First 18 transactions = $${runningTotal.toFixed(
              2
            )} ***`
          );
          break;
        }
      }
    }
  } catch (error) {
    console.error("Error testing October month filter:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

// Run the test script
testOctoberMonthFilter();
