const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function checkAugustLotterySales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const transactionCollection = db.collection("transactions");

    console.log("\n🔍 Checking August 2025 Lottery Sales...");

    // Get all August lottery transactions
    const augustLotteryTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-08-01T00:00:00.000Z"),
          $lt: new Date("2025-09-01T00:00:00.000Z"),
        },
        $or: [
          { items: { $elemMatch: { category: "Lotto" } } },
          { items: { $elemMatch: { category: "Lotto instant" } } },
        ],
      })
      .sort({ transactionId: 1 })
      .toArray();

    console.log(
      `📊 Total August lottery transactions found: ${augustLotteryTransactions.length}`
    );

    // Calculate total by category
    let lottoTotal = 0;
    let lottoInstantTotal = 0;
    let totalLotterySales = 0;

    const categoryBreakdown = {
      Lotto: { total: 0, count: 0 },
      "Lotto instant": { total: 0, count: 0 },
    };

    augustLotteryTransactions.forEach((transaction) => {
      totalLotterySales += transaction.total;

      let hasLotto = false;
      let hasLottoInstant = false;

      transaction.items.forEach((item) => {
        if (item.category === "Lotto") {
          lottoTotal += item.total;
          hasLotto = true;
        }
        if (item.category === "Lotto instant") {
          lottoInstantTotal += item.total;
          hasLottoInstant = true;
        }
      });

      if (hasLotto) categoryBreakdown["Lotto"].count++;
      if (hasLottoInstant) categoryBreakdown["Lotto instant"].count++;
    });

    categoryBreakdown["Lotto"].total = lottoTotal;
    categoryBreakdown["Lotto instant"].total = lottoInstantTotal;

    console.log(`💰 August Lottery Sales Breakdown:`);
    console.log(`   Total Lottery Sales: $${totalLotterySales.toFixed(2)}`);
    console.log(
      `   Lotto Sales: $${lottoTotal.toFixed(2)} (${
        categoryBreakdown["Lotto"].count
      } transactions)`
    );
    console.log(
      `   Lotto Instant Sales: $${lottoInstantTotal.toFixed(2)} (${
        categoryBreakdown["Lotto instant"].count
      } transactions)`
    );
    console.log(`   Expected was: $29,560.00`);
    console.log(`   Difference: $${(totalLotterySales - 29560).toFixed(2)}`);

    // Check why the discrepancy - analyze transaction ID ranges
    console.log(`\n🆔 Transaction ID Analysis:`);

    const transactionRanges = {};
    augustLotteryTransactions.forEach((t) => {
      const rangeStart = Math.floor(t.transactionId / 1000) * 1000;
      const rangeKey = `${rangeStart}-${rangeStart + 999}`;

      if (!transactionRanges[rangeKey]) {
        transactionRanges[rangeKey] = [];
      }
      transactionRanges[rangeKey].push(t);
    });

    Object.entries(transactionRanges).forEach(([range, transactions]) => {
      const total = transactions.reduce((sum, t) => sum + t.total, 0);
      const minId = Math.min(...transactions.map((t) => t.transactionId));
      const maxId = Math.max(...transactions.map((t) => t.transactionId));

      console.log(
        `   Range ${range}: ${
          transactions.length
        } transactions ($${total.toFixed(2)}) [${minId}-${maxId}]`
      );
    });

    // Check if there are any negative transactions (like winnings)
    const negativeTransactions = augustLotteryTransactions.filter(
      (t) => t.total < 0
    );
    if (negativeTransactions.length > 0) {
      console.log(
        `\n⚠️  Found ${negativeTransactions.length} negative lottery transactions:`
      );
      negativeTransactions.forEach((t) => {
        console.log(
          `   ID: ${t.transactionId}, Amount: $${t.total.toFixed(
            2
          )}, Items: ${t.items.map((i) => i.name).join(", ")}`
        );
      });
    }

    // Check the frontend calculation to see if it matches
    console.log(`\n🔧 Frontend Calculation Check:`);
    console.log(`Using the same logic as the transactions page...`);

    // This mimics the frontend logic
    let frontendLottoTotal = 0;
    augustLotteryTransactions.forEach((transaction) => {
      // Frontend uses Math.abs() for lotto totals in some calculations
      if (
        transaction.items &&
        transaction.items.some(
          (item) =>
            item.category === "Lotto" || item.category === "Lotto instant"
        )
      ) {
        frontendLottoTotal += Math.abs(transaction.total);
      }
    });

    console.log(
      `   Frontend calculation (with Math.abs): $${frontendLottoTotal.toFixed(
        2
      )}`
    );
    console.log(`   Direct sum: $${totalLotterySales.toFixed(2)}`);

    // Show a few sample transactions
    console.log(`\n📋 Sample August Lottery Transactions:`);
    augustLotteryTransactions.slice(0, 5).forEach((transaction, index) => {
      console.log(
        `   ${index + 1}. ID: ${
          transaction.transactionId
        }, Total: $${transaction.total.toFixed(2)}, Items: ${
          transaction.items.length
        }`
      );
      transaction.items.forEach((item) => {
        if (item.category === "Lotto" || item.category === "Lotto instant") {
          console.log(
            `      - ${item.category}: ${item.name} ($${item.price} x ${item.quantity})`
          );
        }
      });
    });
  } catch (error) {
    console.error("Error checking August lottery sales:", error);
  } finally {
    await client.close();
  }
}

checkAugustLotterySales();
