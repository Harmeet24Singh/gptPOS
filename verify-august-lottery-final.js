const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function verifyAugustLotteryFinal() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const transactionCollection = db.collection("transactions");

    console.log("\n📊 Final August 2025 Lottery Verification");
    console.log("=".repeat(50));

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
      .toArray();

    // Calculate totals by category
    let lottoTotal = 0;
    let lottoInstantTotal = 0;
    let transactionCount = 0;
    let cashTransactions = 0;
    let cardTransactions = 0;

    const itemCounts = {};

    augustLotteryTransactions.forEach((transaction) => {
      transactionCount++;

      // Payment method analysis
      if (
        transaction.paymentMethod === "Cash" ||
        (transaction.paymentBreakdown && transaction.paymentBreakdown.cash > 0)
      ) {
        cashTransactions++;
      } else {
        cardTransactions++;
      }

      transaction.items.forEach((item) => {
        if (item.category === "Lotto") {
          lottoTotal += item.price;
        } else if (item.category === "Lotto instant") {
          lottoInstantTotal += item.price;
        }

        // Count item frequencies
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = { count: 0, total: 0 };
        }
        itemCounts[item.name].count++;
        itemCounts[item.name].total += item.price;
      });
    });

    const grandTotal = lottoTotal + lottoInstantTotal;

    console.log(`\n📈 August Lottery Summary:`);
    console.log(`   Total Transactions: ${transactionCount}`);
    console.log(`   Total Sales: $${grandTotal.toFixed(2)}`);
    console.log(`   Lotto (machine) Sales: $${lottoTotal.toFixed(2)}`);
    console.log(`   Lotto Instant Sales: $${lottoInstantTotal.toFixed(2)}`);
    console.log(
      `   Cash Transactions: ${cashTransactions} (${(
        (cashTransactions / transactionCount) *
        100
      ).toFixed(1)}%)`
    );
    console.log(
      `   Card Transactions: ${cardTransactions} (${(
        (cardTransactions / transactionCount) *
        100
      ).toFixed(1)}%)`
    );

    // Transaction ID ranges
    const transactionIds = augustLotteryTransactions
      .map((t) => t.transactionId)
      .sort((a, b) => a - b);
    console.log(`\n🔢 Transaction ID Range:`);
    console.log(`   Lowest: ${transactionIds[0]}`);
    console.log(`   Highest: ${transactionIds[transactionIds.length - 1]}`);

    // Top selling items
    const sortedItems = Object.entries(itemCounts)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10);

    console.log(`\n🏆 Top 10 Lottery Items (by revenue):`);
    sortedItems.forEach(([itemName, data], index) => {
      console.log(
        `   ${index + 1}. ${itemName}: ${
          data.count
        } sold, $${data.total.toFixed(2)}`
      );
    });

    // Check for any problematic transactions
    const problemTransactions = augustLotteryTransactions.filter((t) => {
      return t.items.some(
        (item) =>
          item.name.includes("Winnings") ||
          item.name.includes("Monopoly") ||
          !["Lotto", "Lotto instant"].includes(item.category)
      );
    });

    if (problemTransactions.length > 0) {
      console.log(
        `\n⚠️  Found ${problemTransactions.length} problematic transactions:`
      );
      problemTransactions.forEach((t) => {
        console.log(
          `   ID ${t.transactionId}: ${t.items.map((i) => i.name).join(", ")}`
        );
      });
    } else {
      console.log(`\n✅ No problematic transactions found`);
    }

    console.log(`\n💰 What you should see in your POS frontend:`);
    console.log(`   August 2025 Lottery Sales: $${grandTotal.toFixed(2)}`);
    console.log(`   (This should match what appears in your sales reports)`);
  } catch (error) {
    console.error("Error verifying August lottery sales:", error);
  } finally {
    await client.close();
  }
}

verifyAugustLotteryFinal();
