const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function checkLotteryData() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const inventoryCollection = db.collection("inventory");
    const transactionCollection = db.collection("transactions");

    console.log("\n🎰 Checking Lottery Categories and Items...");

    // Check Lotto category items
    const lottoItems = await inventoryCollection
      .find({
        category: "Lotto",
      })
      .toArray();

    console.log(`\n📋 Lotto Category Items (${lottoItems.length} items):`);
    lottoItems.forEach((item, index) => {
      console.log(
        `   ${index + 1}. ${item.name} - $${item.price} (Stock: ${item.stock})`
      );
    });

    // Check Lotto Instant category items
    const lottoInstantItems = await inventoryCollection
      .find({
        category: "Lotto Instant",
      })
      .toArray();

    console.log(
      `\n🎫 Lotto Instant Category Items (${lottoInstantItems.length} items):`
    );
    lottoInstantItems.forEach((item, index) => {
      console.log(
        `   ${index + 1}. ${item.name} - $${item.price} (Stock: ${item.stock})`
      );
    });

    console.log(
      `\n📊 Total Lottery Items Available: ${
        lottoItems.length + lottoInstantItems.length
      }`
    );

    // Check December 2025 lottery sales (hand inputted)
    console.log(`\n🗓️ Checking December 2025 Lottery Sales...`);

    const decemberLotterySales = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-12-01T00:00:00.000Z"),
          $lt: new Date("2026-01-01T00:00:00.000Z"),
        },
        $or: [
          { items: { $elemMatch: { category: "Lotto" } } },
          { items: { $elemMatch: { category: "Lotto Instant" } } },
        ],
      })
      .toArray();

    console.log(
      `\n📈 December Lottery Transactions: ${decemberLotterySales.length}`
    );

    if (decemberLotterySales.length > 0) {
      // Analyze December lottery sales
      let totalDecemberLottery = 0;
      let lottoTotal = 0;
      let lottoInstantTotal = 0;
      let lottoTransactions = 0;
      let lottoInstantTransactions = 0;

      const itemFrequency = {};

      decemberLotterySales.forEach((transaction) => {
        totalDecemberLottery += transaction.total;

        let hasLotto = false;
        let hasLottoInstant = false;

        transaction.items.forEach((item) => {
          if (item.category === "Lotto") {
            lottoTotal += item.total;
            hasLotto = true;
          }
          if (item.category === "Lotto Instant") {
            lottoInstantTotal += item.total;
            hasLottoInstant = true;
          }

          // Track item frequency
          const key = `${item.category}: ${item.name}`;
          itemFrequency[key] = (itemFrequency[key] || 0) + item.quantity;
        });

        if (hasLotto) lottoTransactions++;
        if (hasLottoInstant) lottoInstantTransactions++;
      });

      console.log(`\n💰 December Lottery Sales Breakdown:`);
      console.log(
        `   Total Lottery Sales: $${totalDecemberLottery.toFixed(2)}`
      );
      console.log(
        `   Lotto Sales: $${lottoTotal.toFixed(
          2
        )} (${lottoTransactions} transactions)`
      );
      console.log(
        `   Lotto Instant Sales: $${lottoInstantTotal.toFixed(
          2
        )} (${lottoInstantTransactions} transactions)`
      );

      if (lottoTotal > 0 && lottoInstantTotal > 0) {
        const lottoPercentage = (
          (lottoTotal / totalDecemberLottery) *
          100
        ).toFixed(1);
        const instantPercentage = (
          (lottoInstantTotal / totalDecemberLottery) *
          100
        ).toFixed(1);
        console.log(
          `   Distribution: ${lottoPercentage}% Lotto, ${instantPercentage}% Instant`
        );
      }

      console.log(`\n🎫 Top Selling Lottery Items in December:`);
      const sortedItems = Object.entries(itemFrequency).sort(
        (a, b) => b[1] - a[1]
      );
      sortedItems.slice(0, 10).forEach(([item, qty], index) => {
        console.log(`   ${index + 1}. ${item}: ${qty} tickets`);
      });

      // Payment method analysis
      const paymentBreakdown = decemberLotterySales.reduce((acc, t) => {
        acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + 1;
        return acc;
      }, {});

      console.log(`\n💳 December Payment Methods:`);
      Object.entries(paymentBreakdown).forEach(([method, count]) => {
        const percentage = (
          (count / decemberLotterySales.length) *
          100
        ).toFixed(1);
        console.log(`   ${method}: ${count} transactions (${percentage}%)`);
      });
    }

    // Check card transaction limits for July (to understand current patterns)
    console.log(`\n💳 Checking July Card Transaction Limits...`);

    const julyCardTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
        paymentMethod: "card",
      })
      .toArray();

    const julyCardTotal = julyCardTransactions.reduce(
      (sum, t) => sum + t.total,
      0
    );
    console.log(`   July Card Transactions: ${julyCardTransactions.length}`);
    console.log(`   July Card Total: $${julyCardTotal.toFixed(2)}`);
    console.log(
      `   Remaining Card Capacity for July: $${Math.max(
        0,
        15000 - julyCardTotal
      ).toFixed(2)}`
    );
  } catch (error) {
    console.error("Error checking lottery data:", error);
  } finally {
    await client.close();
  }
}

checkLotteryData();
