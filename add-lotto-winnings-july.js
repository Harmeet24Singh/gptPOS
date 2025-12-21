const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function addLottoWinningsJuly() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const transactionCollection = db.collection("transactions");

    console.log("\n🎰 Adding Lotto Winnings to July 2025 (targeting ~$800)...");

    // Check current July lottery status
    const currentLottery = await transactionCollection
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date("2025-07-01T00:00:00.000Z"),
              $lt: new Date("2025-08-01T00:00:00.000Z"),
            },
            $or: [
              { items: { $elemMatch: { category: "Lotto" } } },
              { items: { $elemMatch: { category: "Lotto instant" } } },
            ],
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const currentTotal = currentLottery[0]?.total || 0;
    const currentCount = currentLottery[0]?.count || 0;

    console.log(
      `💰 Current July lottery sales: $${currentTotal.toFixed(
        2
      )} (${currentCount} transactions)`
    );

    // Get next transaction ID
    const lastTransaction = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
      })
      .sort({ transactionId: -1 })
      .limit(1)
      .toArray();

    let currentTransactionId =
      lastTransaction.length > 0 ? lastTransaction[0].transactionId + 1 : 82001;
    console.log(`🆔 Starting winnings transaction ID: ${currentTransactionId}`);

    // Lotto winnings amounts based on December patterns (negative values)
    const lottoWinningAmounts = [
      { amount: -2, weight: 20 }, // $2 win
      { amount: -3, weight: 18 }, // $3 win
      { amount: -4, weight: 16 }, // $4 win
      { amount: -5, weight: 15 }, // $5 win
      { amount: -7, weight: 12 }, // $7 win
      { amount: -8, weight: 10 }, // $8 win
      { amount: -9, weight: 10 }, // $9 win
      { amount: -10, weight: 9 }, // $10 win
      { amount: -11, weight: 8 }, // $11 win
      { amount: -12, weight: 7 }, // $12 win
      { amount: -15, weight: 6 }, // $15 win
      { amount: -17, weight: 5 }, // $17 win
      { amount: -18, weight: 5 }, // $18 win
      { amount: -20, weight: 4 }, // $20 win
      { amount: -22, weight: 4 }, // $22 win
      { amount: -24, weight: 3 }, // $24 win
      { amount: -25, weight: 3 }, // $25 win
      { amount: -30, weight: 2 }, // $30 win
      { amount: -40, weight: 2 }, // $40 win
      { amount: -50, weight: 1 }, // $50 win
      { amount: -60, weight: 1 }, // $60 win
      { amount: -80, weight: 1 }, // $80 win
      { amount: -90, weight: 1 }, // $90 win
      { amount: -100, weight: 1 }, // $100 win
      { amount: -120, weight: 1 }, // $120 win
    ];

    const targetWinnings = 800; // Target $800 in winnings (negative)
    let totalWinnings = 0;
    const winningTransactions = [];

    // Business hours: 7 AM to 9 PM
    const businessHours = { start: 7, end: 21 };
    const daysInJuly = 31;

    // Helper function to select weighted random winning amount
    function selectWeightedWinning(winnings) {
      const totalWeight = winnings.reduce((sum, win) => sum + win.weight, 0);
      let random = Math.random() * totalWeight;

      for (const winning of winnings) {
        random -= winning.weight;
        if (random <= 0) return winning;
      }
      return winnings[winnings.length - 1];
    }

    console.log(
      `🎯 Generating lotto winnings transactions targeting $${targetWinnings}...`
    );

    while (Math.abs(totalWinnings) < targetWinnings) {
      // Random day in July
      const day = Math.floor(Math.random() * daysInJuly) + 1;
      const hour =
        Math.floor(Math.random() * (businessHours.end - businessHours.start)) +
        businessHours.start;
      const minute = Math.floor(Math.random() * 60);

      const timestamp = new Date(2025, 6, day, hour, minute);

      // Select winning amount
      const selectedWinning = selectWeightedWinning(lottoWinningAmounts);
      const winningAmount = selectedWinning.amount;

      // Skip if this would exceed our target
      if (Math.abs(totalWinnings + winningAmount) > targetWinnings + 25) {
        continue;
      }

      // Create lotto winnings transaction
      const transaction = {
        transactionId: currentTransactionId,
        timestamp: timestamp,
        items: [
          {
            name: "Lotto Winnings",
            category: "Lotto",
            price: winningAmount,
            quantity: 1,
            total: winningAmount,
            taxable: false,
          },
        ],
        subtotal: winningAmount,
        tax: 0,
        total: winningAmount,
        taxableAmount: 0,
        nonTaxableAmount: winningAmount,
        includeTax: false,
        paymentMethod: "cash", // Winnings are always paid in cash
        paymentBreakdown: [
          {
            method: "cash",
            amount: winningAmount,
          },
        ],
        cashAmount: winningAmount,
        cardAmount: 0,
        cashback: 0,
        finalTotal: winningAmount,
        receiptNumber: `RCP${currentTransactionId + 1}`,
        cashier: "Admin User",
        createdAt: timestamp,
        transactionType: "cash",
      };

      winningTransactions.push(transaction);
      totalWinnings += winningAmount;
      currentTransactionId++;

      // Progress logging every 10 transactions
      if (winningTransactions.length % 10 === 0) {
        console.log(
          `   Generated ${
            winningTransactions.length
          } winnings, total: $${Math.abs(totalWinnings).toFixed(2)}`
        );
      }

      // Safety break
      if (winningTransactions.length > 200) {
        console.log("⚠️  Reached 200 winning transactions, stopping");
        break;
      }
    }

    console.log(`\n📊 Winnings Generation Summary:`);
    console.log(`   Target: $${targetWinnings.toFixed(2)}`);
    console.log(`   Generated: $${Math.abs(totalWinnings).toFixed(2)}`);
    console.log(
      `   Accuracy: ${(
        (Math.abs(totalWinnings) / targetWinnings) *
        100
      ).toFixed(1)}%`
    );
    console.log(`   Total Transactions: ${winningTransactions.length}`);

    // Analyze winning amounts
    const winningBreakdown = {};
    winningTransactions.forEach((t) => {
      const amount = Math.abs(t.total);
      winningBreakdown[amount] = (winningBreakdown[amount] || 0) + 1;
    });

    console.log(`\n💰 Winning Amount Distribution:`);
    Object.entries(winningBreakdown)
      .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
      .forEach(([amount, count]) => {
        console.log(`   $${amount}: ${count} wins`);
      });

    // Insert transactions
    if (winningTransactions.length > 0) {
      console.log(
        `\n💾 Inserting ${winningTransactions.length} lotto winning transactions...`
      );

      const insertResult = await transactionCollection.insertMany(
        winningTransactions
      );
      console.log(
        `✅ Successfully inserted ${insertResult.insertedCount} transactions`
      );

      // Final verification
      const finalLottery = await transactionCollection
        .aggregate([
          {
            $match: {
              timestamp: {
                $gte: new Date("2025-07-01T00:00:00.000Z"),
                $lt: new Date("2025-08-01T00:00:00.000Z"),
              },
              $or: [
                { items: { $elemMatch: { category: "Lotto" } } },
                { items: { $elemMatch: { category: "Lotto instant" } } },
              ],
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$total" },
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();

      const finalTotal = finalLottery[0]?.total || 0;
      const finalCount = finalLottery[0]?.count || 0;

      console.log(`\n✅ Final July Lottery Results:`);
      console.log(`   Previous total: $${currentTotal.toFixed(2)}`);
      console.log(`   Winnings added: $${totalWinnings.toFixed(2)}`);
      console.log(`   New total: $${finalTotal.toFixed(2)}`);
      console.log(`   Total transactions: ${finalCount}`);

      // Show breakdown of positive vs negative
      const positiveTransactions = await transactionCollection
        .find({
          timestamp: {
            $gte: new Date("2025-07-01T00:00:00.000Z"),
            $lt: new Date("2025-08-01T00:00:00.000Z"),
          },
          $or: [
            { items: { $elemMatch: { category: "Lotto" } } },
            { items: { $elemMatch: { category: "Lotto instant" } } },
          ],
          total: { $gt: 0 },
        })
        .toArray();

      const negativeTransactions = await transactionCollection
        .find({
          timestamp: {
            $gte: new Date("2025-07-01T00:00:00.000Z"),
            $lt: new Date("2025-08-01T00:00:00.000Z"),
          },
          $or: [
            { items: { $elemMatch: { category: "Lotto" } } },
            { items: { $elemMatch: { category: "Lotto instant" } } },
          ],
          total: { $lt: 0 },
        })
        .toArray();

      const positiveTotal = positiveTransactions.reduce(
        (sum, t) => sum + t.total,
        0
      );
      const negativeTotal = negativeTransactions.reduce(
        (sum, t) => sum + t.total,
        0
      );

      console.log(`\n📈 Sales vs Winnings Breakdown:`);
      console.log(
        `   Lottery Sales: $${positiveTotal.toFixed(2)} (${
          positiveTransactions.length
        } transactions)`
      );
      console.log(
        `   Lottery Winnings: $${negativeTotal.toFixed(2)} (${
          negativeTransactions.length
        } transactions)`
      );
      console.log(
        `   Net Lottery Revenue: $${(positiveTotal + negativeTotal).toFixed(2)}`
      );

      console.log(`\n🎉 Lotto winnings addition complete!`);
    } else {
      console.log("❌ No winning transactions generated");
    }
  } catch (error) {
    console.error("Error adding lotto winnings:", error);
  } finally {
    await client.close();
  }
}

addLottoWinningsJuly();
