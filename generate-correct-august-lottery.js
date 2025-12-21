const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function generateCorrectAugustLottery() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const transactionCollection = db.collection("transactions");
    const itemCollection = db.collection("items");

    console.log("\n🎯 Generating August lottery to match $29,560 target");
    console.log("=".repeat(60));

    // First, clear existing August lottery sales
    console.log("🧹 Clearing existing August lottery sales...");
    const deleteResult = await transactionCollection.deleteMany({
      timestamp: {
        $gte: new Date("2025-08-01T00:00:00.000Z"),
        $lt: new Date("2025-09-01T00:00:00.000Z"),
      },
      $or: [
        { items: { $elemMatch: { category: "Lotto" } } },
        { items: { $elemMatch: { category: "Lotto instant" } } },
      ],
    });
    console.log(
      `✅ Cleared ${deleteResult.deletedCount} existing transactions`
    );

    // Get actual lottery items from database
    const lotteryItems = await itemCollection
      .find({
        $or: [{ category: "Lotto" }, { category: "Lotto instant" }],
      })
      .toArray();

    console.log(`📦 Found ${lotteryItems.length} lottery items in database`);

    // Separate items by category
    const lottoItems = lotteryItems.filter((item) => item.category === "Lotto");
    const instantItems = lotteryItems.filter(
      (item) => item.category === "Lotto instant"
    );

    console.log(`   Lotto machine items: ${lottoItems.length}`);
    console.log(`   Lotto instant items: ${instantItems.length}`);

    // Target distribution (similar to July pattern)
    const targetAmount = 29560;
    const lottoTargetAmount = Math.floor(targetAmount * 0.65); // ~65% Lotto machine
    const instantTargetAmount = targetAmount - lottoTargetAmount; // ~35% Lotto instant

    console.log(`\n🎯 Target Distribution:`);
    console.log(`   Total: $${targetAmount}`);
    console.log(`   Lotto machine: $${lottoTargetAmount}`);
    console.log(`   Lotto instant: $${instantTargetAmount}`);

    // Get next transaction ID
    const lastTransaction = await transactionCollection.findOne(
      {},
      { sort: { transactionId: -1 } }
    );
    let transactionId = lastTransaction
      ? lastTransaction.transactionId + 1
      : 90001;

    const transactions = [];
    let currentLottoTotal = 0;
    let currentInstantTotal = 0;

    // Generate Lotto machine transactions
    console.log("\n🎰 Generating Lotto machine transactions...");
    while (currentLottoTotal < lottoTargetAmount) {
      const numItems = Math.random() < 0.7 ? 1 : Math.random() < 0.9 ? 2 : 3;
      const transactionItems = [];
      let transactionTotal = 0;

      for (let i = 0; i < numItems; i++) {
        const item = lottoItems[Math.floor(Math.random() * lottoItems.length)];
        transactionItems.push({
          name: item.name,
          price: item.price,
          category: item.category,
          tax: 0,
        });
        transactionTotal += item.price;
      }

      if (currentLottoTotal + transactionTotal <= lottoTargetAmount + 100) {
        // Generate realistic timestamp in August 2025
        const randomDay = Math.floor(Math.random() * 31) + 1;
        const randomHour = Math.floor(Math.random() * 12) + 8; // 8 AM to 8 PM
        const randomMinute = Math.floor(Math.random() * 60);

        const timestamp = new Date(
          `2025-08-${randomDay.toString().padStart(2, "0")}T${randomHour
            .toString()
            .padStart(2, "0")}:${randomMinute
            .toString()
            .padStart(2, "0")}:00.000Z`
        );

        // Payment method distribution (mostly cash for lottery)
        const paymentMethod = Math.random() < 0.8 ? "Cash" : "Card";
        const paymentBreakdown =
          paymentMethod === "Cash"
            ? [{ method: "Cash", amount: transactionTotal }]
            : [{ method: "Card", amount: transactionTotal }];

        const transaction = {
          transactionId: transactionId++,
          timestamp: timestamp,
          items: transactionItems,
          total: transactionTotal,
          tax: 0,
          paymentMethod: paymentMethod,
          paymentBreakdown: paymentBreakdown,
          customerId: null,
          employeeId: "emp001",
          status: "completed",
        };

        transactions.push(transaction);
        currentLottoTotal += transactionTotal;
      }
    }

    // Generate Lotto instant transactions
    console.log("🎫 Generating Lotto instant transactions...");
    while (currentInstantTotal < instantTargetAmount) {
      const numItems = Math.random() < 0.6 ? 1 : Math.random() < 0.85 ? 2 : 3;
      const transactionItems = [];
      let transactionTotal = 0;

      for (let i = 0; i < numItems; i++) {
        const item =
          instantItems[Math.floor(Math.random() * instantItems.length)];
        transactionItems.push({
          name: item.name,
          price: item.price,
          category: item.category,
          tax: 0,
        });
        transactionTotal += item.price;
      }

      if (currentInstantTotal + transactionTotal <= instantTargetAmount + 100) {
        // Generate realistic timestamp in August 2025
        const randomDay = Math.floor(Math.random() * 31) + 1;
        const randomHour = Math.floor(Math.random() * 12) + 8;
        const randomMinute = Math.floor(Math.random() * 60);

        const timestamp = new Date(
          `2025-08-${randomDay.toString().padStart(2, "0")}T${randomHour
            .toString()
            .padStart(2, "0")}:${randomMinute
            .toString()
            .padStart(2, "0")}:00.000Z`
        );

        const paymentMethod = Math.random() < 0.85 ? "Cash" : "Card";
        const paymentBreakdown =
          paymentMethod === "Cash"
            ? [{ method: "Cash", amount: transactionTotal }]
            : [{ method: "Card", amount: transactionTotal }];

        const transaction = {
          transactionId: transactionId++,
          timestamp: timestamp,
          items: transactionItems,
          total: transactionTotal,
          tax: 0,
          paymentMethod: paymentMethod,
          paymentBreakdown: paymentBreakdown,
          customerId: null,
          employeeId: "emp001",
          status: "completed",
        };

        transactions.push(transaction);
        currentInstantTotal += transactionTotal;
      }
    }

    // Insert all transactions
    console.log(
      `\n💾 Inserting ${transactions.length} lottery transactions...`
    );
    if (transactions.length > 0) {
      await transactionCollection.insertMany(transactions);
      console.log(`✅ Inserted ${transactions.length} transactions`);
    }

    // Final verification
    const finalTotal = currentLottoTotal + currentInstantTotal;
    const accuracy = ((finalTotal / targetAmount) * 100).toFixed(1);

    console.log(`\n🎉 August Lottery Generation Complete!`);
    console.log(`   Target: $${targetAmount}`);
    console.log(`   Generated: $${finalTotal.toFixed(2)}`);
    console.log(`   Accuracy: ${accuracy}%`);
    console.log(`   Lotto machine: $${currentLottoTotal.toFixed(2)}`);
    console.log(`   Lotto instant: $${currentInstantTotal.toFixed(2)}`);
    console.log(`   Total transactions: ${transactions.length}`);
  } catch (error) {
    console.error("Error generating August lottery sales:", error);
  } finally {
    await client.close();
  }
}

generateCorrectAugustLottery();
