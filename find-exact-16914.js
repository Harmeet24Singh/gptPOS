const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function findExact16914() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const transactionCollection = db.collection("transactions");

    console.log("\n🎯 Finding exact $16,914 calculation");
    console.log("=".repeat(50));

    // Let's try different date ranges and filters
    const dateRanges = [
      {
        name: "August 1-31, 2025",
        start: new Date("2025-08-01T00:00:00.000Z"),
        end: new Date("2025-09-01T00:00:00.000Z"),
      },
      {
        name: "August 1-30, 2025",
        start: new Date("2025-08-01T00:00:00.000Z"),
        end: new Date("2025-08-31T23:59:59.999Z"),
      },
      {
        name: "August 1-20, 2025 (partial month)",
        start: new Date("2025-08-01T00:00:00.000Z"),
        end: new Date("2025-08-21T00:00:00.000Z"),
      },
    ];

    for (const dateRange of dateRanges) {
      console.log(`\n📅 Date Range: ${dateRange.name}`);
      console.log("-".repeat(40));

      // Test different category combinations
      const tests = [
        {
          name: "Lotto only",
          query: {
            timestamp: { $gte: dateRange.start, $lt: dateRange.end },
            items: { $elemMatch: { category: "Lotto" } },
          },
        },
        {
          name: "Lotto instant only",
          query: {
            timestamp: { $gte: dateRange.start, $lt: dateRange.end },
            items: { $elemMatch: { category: "Lotto instant" } },
          },
        },
      ];

      for (const test of tests) {
        const transactions = await transactionCollection
          .find(test.query)
          .toArray();
        const total = transactions.reduce((sum, t) => sum + t.total, 0);

        console.log(
          `   ${test.name}: ${
            transactions.length
          } transactions, $${total.toFixed(2)}`
        );

        if (Math.abs(total - 16914) < 5) {
          console.log(`   🎯 CLOSE MATCH! This is very close to $16,914!`);
        }
      }
    }

    // Let's also check if some transactions are being filtered out
    console.log(`\n🔍 Checking for filtered transactions...`);

    const augustTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-08-01T00:00:00.000Z"),
          $lt: new Date("2025-09-01T00:00:00.000Z"),
        },
        items: { $elemMatch: { category: "Lotto" } },
      })
      .toArray();

    // Group by transaction ID ranges to see if some are being excluded
    const idRanges = {
      "80000-84999": 0,
      "85000-86999": 0,
      "87000-89999": 0,
      "90000+": 0,
    };

    let totalByRange = {
      "80000-84999": 0,
      "85000-86999": 0,
      "87000-89999": 0,
      "90000+": 0,
    };

    augustTransactions.forEach((t) => {
      const id = t.transactionId;
      if (id >= 80000 && id <= 84999) {
        idRanges["80000-84999"]++;
        totalByRange["80000-84999"] += t.total;
      } else if (id >= 85000 && id <= 86999) {
        idRanges["85000-86999"]++;
        totalByRange["85000-86999"] += t.total;
      } else if (id >= 87000 && id <= 89999) {
        idRanges["87000-89999"]++;
        totalByRange["87000-89999"] += t.total;
      } else if (id >= 90000) {
        idRanges["90000+"]++;
        totalByRange["90000+"] += t.total;
      }
    });

    console.log(`\n📊 Lotto transactions by ID range:`);
    Object.entries(idRanges).forEach(([range, count]) => {
      const total = totalByRange[range];
      console.log(`   ${range}: ${count} transactions, $${total.toFixed(2)}`);

      if (Math.abs(total - 16914) < 5) {
        console.log(`   🎯 MATCH! This range totals close to $16,914!`);
      }
    });

    // Check the main range we used for generation
    const mainRangeTotal = totalByRange["85000-86999"];
    console.log(
      `\n💡 Main generation range (85000-86999): $${mainRangeTotal.toFixed(2)}`
    );

    if (Math.abs(mainRangeTotal - 16914) < 100) {
      console.log(`✅ This is likely what the frontend is showing!`);
      console.log(
        `The difference of $${Math.abs(mainRangeTotal - 16914).toFixed(
          2
        )} might be due to:`
      );
      console.log(`   - Different category filtering`);
      console.log(`   - Excluded transaction IDs`);
      console.log(`   - Date range differences`);
    }
  } catch (error) {
    console.error("Error finding exact calculation:", error);
  } finally {
    await client.close();
  }
}

findExact16914();
