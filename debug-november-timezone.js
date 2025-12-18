const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function analyzeNovemberIssue() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    console.log("=== NOVEMBER ANALYSIS - FRONTEND PERSPECTIVE ===");

    // This is likely how the frontend is querying (local time zone)
    const novemberStart = new Date("2025-11-01T00:00:00.000-05:00"); // EST/EDT
    const decemberStart = new Date("2025-12-01T00:00:00.000-05:00"); // EST/EDT

    console.log(
      `November range (local timezone): ${novemberStart.toISOString()} to ${decemberStart.toISOString()}`
    );

    const novemberTransactions = await collection
      .find({
        timestamp: {
          $gte: novemberStart,
          $lt: decemberStart,
        },
      })
      .toArray();

    console.log(
      `Total November transactions (timezone-aware): ${novemberTransactions.length}`
    );

    // Calculate grocery totals in November
    let novemberGroceryTotal = 0;
    let novemberGroceryCount = 0;

    novemberTransactions.forEach((transaction) => {
      if (
        transaction.items &&
        transaction.items.some((item) => item.category === "Grocery")
      ) {
        novemberGroceryCount++;
        novemberGroceryTotal += transaction.total;
      }
    });

    console.log(`November grocery transactions: ${novemberGroceryCount}`);
    console.log(`November grocery total: $${novemberGroceryTotal.toFixed(2)}`);

    // Also check what the total November sales are
    let totalNovemberSales = 0;
    novemberTransactions.forEach((t) => (totalNovemberSales += t.total));
    console.log(`Total November sales: $${totalNovemberSales.toFixed(2)}`);

    // Break down by category
    const categoryTotals = {};
    novemberTransactions.forEach((transaction) => {
      if (transaction.items && transaction.items.length > 0) {
        transaction.items.forEach((item) => {
          const category = item.category || "Unknown";
          if (!categoryTotals[category]) {
            categoryTotals[category] = { count: 0, total: 0 };
          }
          categoryTotals[category].count++;
          categoryTotals[category].total += transaction.total;
        });
      }
    });

    console.log("\nNovember sales breakdown by category:");
    Object.entries(categoryTotals)
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([category, data]) => {
        console.log(
          `${category}: ${data.count} items, $${data.total.toFixed(2)}`
        );
      });

    // Now let's also check October with the same timezone logic
    console.log("\n=== OCTOBER COMPARISON (TIMEZONE-AWARE) ===");

    const octoberStart = new Date("2025-10-01T00:00:00.000-04:00"); // EDT
    const novStart = new Date("2025-11-01T00:00:00.000-05:00"); // EST (DST ends)

    console.log(
      `October range (local timezone): ${octoberStart.toISOString()} to ${novStart.toISOString()}`
    );

    const octoberTransactions = await collection
      .find({
        timestamp: {
          $gte: octoberStart,
          $lt: novStart,
        },
      })
      .toArray();

    let octoberGroceryTotal = 0;
    let octoberGroceryCount = 0;

    octoberTransactions.forEach((transaction) => {
      if (
        transaction.items &&
        transaction.items.some((item) => item.category === "Grocery")
      ) {
        octoberGroceryCount++;
        octoberGroceryTotal += transaction.total;
      }
    });

    console.log(
      `October grocery transactions (timezone-aware): ${octoberGroceryCount}`
    );
    console.log(
      `October grocery total (timezone-aware): $${octoberGroceryTotal.toFixed(
        2
      )}`
    );

    // Check for transactions right around the October/November boundary
    console.log("\n=== BOUNDARY TRANSACTIONS (Oct 31 - Nov 1) ===");

    const boundaryStart = new Date("2025-10-31T18:00:00.000-04:00"); // 6 PM EDT Oct 31
    const boundaryEnd = new Date("2025-11-01T06:00:00.000-05:00"); // 6 AM EST Nov 1

    const boundaryTransactions = await collection
      .find({
        timestamp: {
          $gte: boundaryStart,
          $lt: boundaryEnd,
        },
      })
      .sort({ timestamp: 1 })
      .toArray();

    console.log(
      `Transactions around Oct 31-Nov 1 boundary: ${boundaryTransactions.length}`
    );

    boundaryTransactions.forEach((t, i) => {
      const localTime = new Date(t.timestamp.getTime() - 5 * 60 * 60 * 1000); // Convert to EST
      const groceryItems = t.items
        ? t.items.filter((item) => item.category === "Grocery").length
        : 0;

      if (groceryItems > 0) {
        console.log(
          `${
            i + 1
          }. ${t.timestamp.toISOString()} (${localTime.toISOString()}) | $${
            t.total
          } | ${groceryItems} grocery items | ID: ${t.transactionId}`
        );
      }
    });
  } catch (error) {
    console.error("Error analyzing November issue:", error);
  } finally {
    await client.close();
    console.log("\nConnection closed");
  }
}

// Run the analysis
analyzeNovemberIssue();
