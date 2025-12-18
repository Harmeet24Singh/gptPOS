const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function debugOctoberTransactions() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Check total October alcohol transactions
    const alcoholQuery = {
      timestamp: {
        $gte: new Date("2025-10-01T00:00:00.000Z"),
        $lt: new Date("2025-11-01T00:00:00.000Z"),
      },
      "items.category": "Alcohol",
    };

    const alcoholTransactions = await collection.find(alcoholQuery).toArray();
    console.log(
      `Total October alcohol transactions in database: ${alcoholTransactions.length}`
    );

    if (alcoholTransactions.length > 0) {
      let totalSales = 0;
      alcoholTransactions.forEach((t) => (totalSales += t.total));
      console.log(`Total alcohol sales: $${totalSales.toFixed(2)}`);

      // Show first few transactions
      console.log("\nFirst 3 alcohol transactions:");
      alcoholTransactions.slice(0, 3).forEach((t) => {
        console.log(
          `- ${t.timestamp} | $${t.total} | ${
            t.paymentBreakdown?.[0]?.method || "no payment"
          }`
        );
      });
    }

    // Check ALL October transactions (not just alcohol)
    const allOctoberQuery = {
      timestamp: {
        $gte: new Date("2025-10-01T00:00:00.000Z"),
        $lt: new Date("2025-11-01T00:00:00.000Z"),
      },
    };

    const allOctoberTransactions = await collection
      .find(allOctoberQuery)
      .toArray();
    console.log(
      `\nTotal ALL October transactions: ${allOctoberTransactions.length}`
    );

    if (allOctoberTransactions.length !== alcoholTransactions.length) {
      console.log("There are non-alcohol October transactions too!");

      // Group by category
      const categoryStats = {};
      allOctoberTransactions.forEach((t) => {
        if (t.items && t.items.length > 0) {
          t.items.forEach((item) => {
            const category = item.category || "Unknown";
            if (!categoryStats[category]) {
              categoryStats[category] = { count: 0, total: 0 };
            }
            categoryStats[category].count++;
            categoryStats[category].total += t.total;
          });
        } else {
          const category = "No Items";
          if (!categoryStats[category]) {
            categoryStats[category] = { count: 0, total: 0 };
          }
          categoryStats[category].count++;
          categoryStats[category].total += t.total;
        }
      });

      console.log("\nOctober transactions by category:");
      Object.entries(categoryStats).forEach(([category, stats]) => {
        console.log(
          `${category}: ${stats.count} transactions, $${stats.total.toFixed(2)}`
        );
      });
    }

    // Check what the frontend might be filtering
    console.log("\nChecking for transactions that might be filtered out:");

    // Check for transactions without proper payment breakdown
    const badPaymentQuery = {
      timestamp: {
        $gte: new Date("2025-10-01T00:00:00.000Z"),
        $lt: new Date("2025-11-01T00:00:00.000Z"),
      },
      $or: [
        { paymentBreakdown: { $exists: false } },
        { paymentBreakdown: null },
        { paymentBreakdown: [] },
      ],
    };

    const badPaymentCount = await collection.countDocuments(badPaymentQuery);
    console.log(
      `Transactions without proper paymentBreakdown: ${badPaymentCount}`
    );

    // Sample a few transactions that show up as the "18 transactions, $923.78"
    const sampleTransactions = await collection
      .find(allOctoberQuery)
      .limit(18)
      .toArray();
    let sampleTotal = 0;
    sampleTransactions.forEach((t) => (sampleTotal += t.total));

    console.log(
      `\nFirst 18 October transactions total: $${sampleTotal.toFixed(2)}`
    );
    console.log(
      "This might be what the frontend is showing if there's a limit or filter issue"
    );
  } catch (error) {
    console.error("Error debugging October transactions:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

// Run the debug script
debugOctoberTransactions();
