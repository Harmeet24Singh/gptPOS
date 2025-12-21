const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function findMissingAmount() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const transactionCollection = db.collection("transactions");

    console.log("\n🔍 Finding the $1,168 difference");
    console.log("$18,082 (Lotto total) - $16,914 (frontend) = $1,168");
    console.log("=".repeat(50));

    // Get all Lotto transactions for August
    const lottoTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-08-01T00:00:00.000Z"),
          $lt: new Date("2025-09-01T00:00:00.000Z"),
        },
        items: { $elemMatch: { category: "Lotto" } },
      })
      .toArray();

    console.log(`Total Lotto transactions: ${lottoTransactions.length}`);
    console.log(
      `Total Lotto amount: $${lottoTransactions
        .reduce((sum, t) => sum + t.total, 0)
        .toFixed(2)}`
    );

    // Let's look for transactions that might be excluded
    const missingAmount = 18082 - 16914; // $1,168
    console.log(`\nLooking for transactions totaling ~$${missingAmount}...`);

    // Check for highest value transactions that might be filtered
    const sortedByValue = lottoTransactions
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);

    console.log(`\n💰 Top 20 highest value Lotto transactions:`);
    let runningTotal = 0;
    sortedByValue.forEach((t, index) => {
      runningTotal += t.total;
      console.log(
        `${index + 1}. ID ${t.transactionId}: $${t.total.toFixed(
          2
        )} (Running: $${runningTotal.toFixed(2)})`
      );

      if (Math.abs(runningTotal - missingAmount) < 10) {
        console.log(
          `   🎯 POTENTIAL MATCH! ${
            index + 1
          } transactions = ~$${missingAmount}`
        );
      }
    });

    // Check for specific transaction ID patterns that might be excluded
    console.log(`\n📊 Checking transaction ID patterns...`);

    const idGroups = {};
    lottoTransactions.forEach((t) => {
      const idPrefix = Math.floor(t.transactionId / 100) * 100; // Group by hundreds
      if (!idGroups[idPrefix]) {
        idGroups[idPrefix] = { count: 0, total: 0, transactions: [] };
      }
      idGroups[idPrefix].count++;
      idGroups[idPrefix].total += t.total;
      idGroups[idPrefix].transactions.push(t);
    });

    const sortedGroups = Object.entries(idGroups).sort(
      (a, b) => b[1].total - a[1].total
    );

    console.log(`Transaction groups by ID range:`);
    sortedGroups.forEach(([prefix, data]) => {
      const endRange = parseInt(prefix) + 99;
      console.log(
        `${prefix}-${endRange}: ${
          data.count
        } transactions, $${data.total.toFixed(2)}`
      );

      if (Math.abs(data.total - missingAmount) < 50) {
        console.log(
          `   🎯 CLOSE! This group is close to the missing $${missingAmount}`
        );
      }
    });

    // Check for specific patterns that might cause exclusion
    console.log(`\n🔍 Checking for patterns that might cause exclusion...`);

    // Check for transactions with specific amounts that sum to ~$1,168
    const commonAmounts = {};
    lottoTransactions.forEach((t) => {
      const amount = t.total;
      if (!commonAmounts[amount]) {
        commonAmounts[amount] = { count: 0, total: 0 };
      }
      commonAmounts[amount].count++;
      commonAmounts[amount].total += amount;
    });

    const sortedAmounts = Object.entries(commonAmounts)
      .filter(([amount, data]) => data.total >= 100) // Only significant amounts
      .sort((a, b) => b[1].total - a[1].total);

    console.log(`\nTransaction amounts that could sum to ~$1,168:`);
    sortedAmounts.slice(0, 10).forEach(([amount, data]) => {
      console.log(
        `$${amount}: ${data.count} transactions = $${data.total.toFixed(
          2
        )} total`
      );

      if (Math.abs(data.total - missingAmount) < 100) {
        console.log(
          `   🎯 POSSIBLE! This amount pattern could account for the difference`
        );
      }
    });

    // Let's specifically look for the exact difference
    console.log(`\n🎯 Testing specific exclusion scenarios:`);

    // Scenario 1: Exclude highest-value transactions
    let testTotal = lottoTransactions.reduce((sum, t) => sum + t.total, 0);
    const sortedDesc = lottoTransactions.sort((a, b) => b.total - a.total);

    for (let i = 1; i <= 50; i++) {
      const excludedTotal = sortedDesc
        .slice(0, i)
        .reduce((sum, t) => sum + t.total, 0);
      const remainingTotal = testTotal - excludedTotal;

      if (Math.abs(remainingTotal - 16914) < 5) {
        console.log(
          `✅ FOUND IT! Excluding top ${i} transactions gives $${remainingTotal.toFixed(
            2
          )}`
        );
        console.log(
          `Excluded transactions total: $${excludedTotal.toFixed(2)}`
        );
        break;
      }
    }
  } catch (error) {
    console.error("Error finding missing amount:", error);
  } finally {
    await client.close();
  }
}

findMissingAmount();
