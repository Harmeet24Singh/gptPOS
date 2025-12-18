const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function investigateNovemberGrocery() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Check November grocery transactions
    console.log("=== NOVEMBER GROCERY ANALYSIS ===");
    const novemberGroceryQuery = {
      timestamp: {
        $gte: new Date("2025-11-01T00:00:00.000Z"),
        $lt: new Date("2025-12-01T00:00:00.000Z"),
      },
      "items.category": "Grocery",
    };

    const novemberGrocery = await collection
      .find(novemberGroceryQuery)
      .toArray();
    console.log(`November grocery transactions: ${novemberGrocery.length}`);

    if (novemberGrocery.length > 0) {
      let novemberTotal = 0;
      novemberGrocery.forEach((t) => (novemberTotal += t.total));
      console.log(`November grocery sales: $${novemberTotal.toFixed(2)}`);

      // Show first few November grocery transactions with details
      console.log("\nFirst 5 November grocery transactions:");
      novemberGrocery.slice(0, 5).forEach((t, i) => {
        console.log(
          `${i + 1}. ${t.timestamp} | $${t.total} | ID: ${
            t.transactionId || "no ID"
          } | Items: ${t.items?.length || 0}`
        );
        if (t.items && t.items.length > 0) {
          console.log(
            `   Items: ${t.items.map((item) => item.name).join(", ")}`
          );
        }
      });

      // Check date distribution
      const dateDistribution = {};
      novemberGrocery.forEach((t) => {
        const date = t.timestamp.toISOString().split("T")[0];
        dateDistribution[date] = (dateDistribution[date] || 0) + t.total;
      });

      console.log("\nNovember grocery sales by date (first 10 days):");
      Object.keys(dateDistribution)
        .sort()
        .slice(0, 10)
        .forEach((date) => {
          const count = novemberGrocery.filter(
            (t) => t.timestamp.toISOString().split("T")[0] === date
          ).length;
          console.log(
            `${date}: ${count} transactions, $${dateDistribution[date].toFixed(
              2
            )}`
          );
        });
    }

    // Also check October for comparison
    console.log("\n=== OCTOBER GROCERY COMPARISON ===");
    const octoberGroceryQuery = {
      timestamp: {
        $gte: new Date("2025-10-01T00:00:00.000Z"),
        $lt: new Date("2025-11-01T00:00:00.000Z"),
      },
      "items.category": "Grocery",
    };

    const octoberGrocery = await collection.find(octoberGroceryQuery).toArray();
    let octoberTotal = 0;
    octoberGrocery.forEach((t) => (octoberTotal += t.total));
    console.log(
      `October grocery: ${
        octoberGrocery.length
      } transactions, $${octoberTotal.toFixed(2)}`
    );

    // Check if there are any transactions that might have wrong dates
    console.log("\n=== POTENTIAL DATE ISSUES ===");

    // Look for transactions with transactionId patterns from October that ended up in November
    if (novemberGrocery.length > 0) {
      const suspiciousTransactions = novemberGrocery.filter((t) => {
        // Check if transactionId suggests it should be October (200000-300000 range)
        return (
          t.transactionId &&
          t.transactionId >= 200000 &&
          t.transactionId < 300000
        );
      });

      if (suspiciousTransactions.length > 0) {
        console.log(
          `Found ${suspiciousTransactions.length} November transactions with October-like IDs:`
        );
        suspiciousTransactions.slice(0, 5).forEach((t, i) => {
          console.log(
            `${i + 1}. ID: ${t.transactionId} | ${t.timestamp} | $${t.total}`
          );
        });
      }

      // Check for transactions that might be duplicates
      const octoberIds = new Set(
        octoberGrocery.map((t) => t.transactionId).filter((id) => id)
      );
      const novemberIds = novemberGrocery
        .map((t) => t.transactionId)
        .filter((id) => id);
      const duplicateIds = novemberIds.filter((id) => octoberIds.has(id));

      if (duplicateIds.length > 0) {
        console.log(
          `Found ${duplicateIds.length} duplicate transaction IDs between October and November`
        );
        console.log("Sample duplicates:", duplicateIds.slice(0, 5));
      }
    }

    // Check all November transactions (not just grocery) to see what else might be there
    console.log("\n=== ALL NOVEMBER TRANSACTIONS ===");
    const allNovemberQuery = {
      timestamp: {
        $gte: new Date("2025-11-01T00:00:00.000Z"),
        $lt: new Date("2025-12-01T00:00:00.000Z"),
      },
    };

    const allNovember = await collection.find(allNovemberQuery).toArray();
    console.log(`Total November transactions: ${allNovember.length}`);

    const categoryBreakdown = {};
    allNovember.forEach((t) => {
      if (t.items && t.items.length > 0) {
        t.items.forEach((item) => {
          const category = item.category || "Unknown";
          categoryBreakdown[category] = categoryBreakdown[category] || {
            count: 0,
            total: 0,
          };
          categoryBreakdown[category].count++;
          categoryBreakdown[category].total += t.total;
        });
      } else {
        categoryBreakdown["No Items"] = categoryBreakdown["No Items"] || {
          count: 0,
          total: 0,
        };
        categoryBreakdown["No Items"].count++;
        categoryBreakdown["No Items"].total += t.total;
      }
    });

    console.log("\nNovember transactions by category:");
    Object.entries(categoryBreakdown).forEach(([category, data]) => {
      console.log(
        `${category}: ${
          data.count
        } items in transactions, $${data.total.toFixed(2)}`
      );
    });
  } catch (error) {
    console.error("Error investigating November grocery:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

// Run the investigation script
investigateNovemberGrocery();
