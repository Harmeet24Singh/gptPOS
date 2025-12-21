const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function generateLotterySalesAugust() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const transactionCollection = db.collection("transactions");

    console.log(
      "\n🎰 Generating August 2025 lottery sales targeting $29,560..."
    );
    console.log(
      "Using ACTUAL database items and respecting $15,000 card limit"
    );

    // ACTUAL Lotto instant items from database
    const actualLottoInstantItems = [
      { name: "Crossword", category: "Lotto instant", price: 3.0, weight: 15 },
      {
        name: "Crossword Tripler",
        category: "Lotto instant",
        price: 5.0,
        weight: 12,
      },
      {
        name: "Crossword Deluxe",
        category: "Lotto instant",
        price: 10.0,
        weight: 10,
      },
      {
        name: "Crossword Extreme",
        category: "Lotto instant",
        price: 30.0,
        weight: 5,
      },
      { name: "Plinko", category: "Lotto instant", price: 5.0, weight: 12 },
      {
        name: "The Big Spin",
        category: "Lotto instant",
        price: 5.0,
        weight: 12,
      },
      {
        name: "The Bigger Spin",
        category: "Lotto instant",
        price: 10.0,
        weight: 10,
      },
      { name: "Diamond", category: "Lotto instant", price: 20.0, weight: 8 },
      { name: "Extreme", category: "Lotto instant", price: 50.0, weight: 3 },
      {
        name: "Bingo Doubler 5",
        category: "Lotto instant",
        price: 5.0,
        weight: 11,
      },
      {
        name: "Bingo Multiplier",
        category: "Lotto instant",
        price: 10.0,
        weight: 9,
      },
      { name: "Candy Cane", category: "Lotto instant", price: 3.0, weight: 13 },
      {
        name: "Cash for Life",
        category: "Lotto instant",
        price: 4.0,
        weight: 11,
      },
      { name: "Frenzy", category: "Lotto instant", price: 2.0, weight: 14 },
      { name: "30X", category: "Lotto instant", price: 30.0, weight: 5 },
      { name: "Gift Pack", category: "Lotto instant", price: 20.0, weight: 7 },
      { name: "Bank IT", category: "Lotto instant", price: 30.0, weight: 5 },
      { name: "Banco", category: "Lotto instant", price: 20.0, weight: 7 },
    ];

    // ACTUAL Lotto machine items (based on December patterns)
    const actualLottoItems = [
      { name: "Lotto $1.00", category: "Lotto", price: 1.0, weight: 8 },
      { name: "Lotto $2.00", category: "Lotto", price: 2.0, weight: 10 },
      { name: "Lotto $3.00", category: "Lotto", price: 3.0, weight: 12 },
      { name: "Lotto $4.00", category: "Lotto", price: 4.0, weight: 12 },
      { name: "Lotto $5.00", category: "Lotto", price: 5.0, weight: 15 },
      { name: "Lotto $6.00", category: "Lotto", price: 6.0, weight: 13 },
      { name: "Lotto $7.00", category: "Lotto", price: 7.0, weight: 12 },
      { name: "Lotto $8.00", category: "Lotto", price: 8.0, weight: 11 },
      { name: "Lotto $9.00", category: "Lotto", price: 9.0, weight: 11 },
      { name: "Lotto $10.00", category: "Lotto", price: 10.0, weight: 14 },
      { name: "Lotto $11.00", category: "Lotto", price: 11.0, weight: 10 },
      { name: "Lotto $12.00", category: "Lotto", price: 12.0, weight: 9 },
      { name: "Lotto $15.00", category: "Lotto", price: 15.0, weight: 8 },
      { name: "Lotto $20.00", category: "Lotto", price: 20.0, weight: 7 },
      { name: "Lotto $25.00", category: "Lotto", price: 25.0, weight: 5 },
      { name: "Lotto $30.00", category: "Lotto", price: 30.0, weight: 4 },
      { name: "Lotto $50.00", category: "Lotto", price: 50.0, weight: 3 },
      { name: "Lotto $75.00", category: "Lotto", price: 75.0, weight: 2 },
      { name: "Lotto $100.00", category: "Lotto", price: 100.0, weight: 1 },
    ];

    console.log(
      `🎫 Using ${actualLottoItems.length} ACTUAL Lotto items and ${actualLottoInstantItems.length} ACTUAL Lotto Instant items`
    );

    // Check August card usage - fresh month, should be under limit
    const augustCardTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-08-01T00:00:00.000Z"),
          $lt: new Date("2025-09-01T00:00:00.000Z"),
        },
        paymentMethod: "card",
      })
      .toArray();

    const currentCardTotal = augustCardTransactions.reduce(
      (sum, t) => sum + t.total,
      0
    );
    const cardLimit = 15000;
    const remainingCardCapacity = cardLimit - currentCardTotal;

    console.log(
      `💳 Current August card usage: $${currentCardTotal.toFixed(2)}`
    );
    console.log(`💳 Card limit: $${cardLimit.toFixed(2)}`);
    console.log(
      `💳 Remaining card capacity: $${remainingCardCapacity.toFixed(2)}`
    );

    // Get starting transaction ID for August lottery
    const existingAugustTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-08-01T00:00:00.000Z"),
          $lt: new Date("2025-09-01T00:00:00.000Z"),
        },
      })
      .sort({ transactionId: -1 })
      .limit(1)
      .toArray();

    let currentTransactionId = 85001; // Start from August range
    if (existingAugustTransactions.length > 0) {
      currentTransactionId = Math.max(
        currentTransactionId,
        existingAugustTransactions[0].transactionId + 1
      );
    }

    console.log(`🆔 Starting transaction ID: ${currentTransactionId}`);

    // Target and tracking
    const targetAmount = 29560;
    let totalGenerated = 0;
    let cardUsed = 0;
    const transactions = [];

    // Allow more card usage for August (up to 30% of target amount or remaining capacity)
    const maxCardForLottery = Math.min(
      remainingCardCapacity * 0.9,
      targetAmount * 0.3
    );
    console.log(
      `💳 Max card for lottery: $${maxCardForLottery.toFixed(
        2
      )} (rest will be CASH)`
    );

    // Business hours: 7 AM to 9 PM
    const businessHours = { start: 7, end: 21 };
    const daysInAugust = 31;

    console.log(`📅 Generating lottery transactions for August 1-31, 2025...`);

    // Helper function to select weighted random item
    function selectWeightedItem(items) {
      const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
      let random = Math.random() * totalWeight;

      for (const item of items) {
        random -= item.weight;
        if (random <= 0) return item;
      }
      return items[items.length - 1];
    }

    while (totalGenerated < targetAmount) {
      // Random day in August
      const day = Math.floor(Math.random() * daysInAugust) + 1;
      const hour =
        Math.floor(Math.random() * (businessHours.end - businessHours.start)) +
        businessHours.start;
      const minute = Math.floor(Math.random() * 60);

      const timestamp = new Date(2025, 7, day, hour, minute); // Month is 0-indexed (7 = August)

      const transactionItems = [];
      let subtotal = 0;

      // Transaction type: Lotto only (55%), Instant only (35%), or Mixed (10%)
      const transactionType = Math.random();

      if (transactionType < 0.55) {
        // Lotto only (1-4 tickets - allow more for higher target)
        const itemCount =
          Math.random() < 0.5
            ? 1
            : Math.random() < 0.8
            ? 2
            : Math.random() < 0.95
            ? 3
            : 4;

        for (let i = 0; i < itemCount; i++) {
          const selectedItem = selectWeightedItem(actualLottoItems);

          transactionItems.push({
            name: selectedItem.name,
            category: selectedItem.category,
            price: selectedItem.price,
            quantity: 1,
            total: selectedItem.price,
            taxable: false,
          });

          subtotal += selectedItem.price;
        }
      } else if (transactionType < 0.9) {
        // Instant only (1-3 tickets)
        const itemCount = Math.random() < 0.6 ? 1 : Math.random() < 0.9 ? 2 : 3;

        for (let i = 0; i < itemCount; i++) {
          const selectedItem = selectWeightedItem(actualLottoInstantItems);

          transactionItems.push({
            name: selectedItem.name,
            category: selectedItem.category,
            price: selectedItem.price,
            quantity: 1,
            total: selectedItem.price,
            taxable: false,
          });

          subtotal += selectedItem.price;
        }
      } else {
        // Mixed (1-2 lotto + 1 instant)
        const lottoCount = Math.random() < 0.7 ? 1 : 2;

        for (let i = 0; i < lottoCount; i++) {
          const lottoItem = selectWeightedItem(actualLottoItems);
          transactionItems.push({
            name: lottoItem.name,
            category: lottoItem.category,
            price: lottoItem.price,
            quantity: 1,
            total: lottoItem.price,
            taxable: false,
          });
          subtotal += lottoItem.price;
        }

        const instantItem = selectWeightedItem(actualLottoInstantItems);
        transactionItems.push({
          name: instantItem.name,
          category: instantItem.category,
          price: instantItem.price,
          quantity: 1,
          total: instantItem.price,
          taxable: false,
        });
        subtotal += instantItem.price;
      }

      const tax = 0;
      const total = subtotal;

      // Skip if this would exceed target
      if (totalGenerated + total > targetAmount + 50) {
        continue;
      }

      // Payment method - allow more card usage for August
      let paymentMethod = "cash"; // Default to cash

      if (cardUsed + total <= maxCardForLottery && Math.random() < 0.25) {
        // 25% chance for card
        paymentMethod = "card";
        cardUsed += total;
      }

      const transaction = {
        transactionId: currentTransactionId,
        timestamp: timestamp,
        items: transactionItems,
        subtotal: subtotal,
        tax: tax,
        total: total,
        taxableAmount: 0,
        nonTaxableAmount: subtotal,
        includeTax: false,
        paymentMethod: paymentMethod,
        paymentBreakdown: [
          {
            method: paymentMethod,
            amount: total,
          },
        ],
        cashAmount: paymentMethod === "cash" ? total : 0,
        cardAmount: paymentMethod === "card" ? total : 0,
        cashback: 0,
        finalTotal: total,
        receiptNumber: `RCP${currentTransactionId + 1}`,
        cashier: "Admin User",
        createdAt: timestamp,
        transactionType: paymentMethod,
      };

      transactions.push(transaction);
      totalGenerated += total;
      currentTransactionId++;

      // Progress logging every 200 transactions
      if (transactions.length % 200 === 0) {
        console.log(
          `   Generated ${
            transactions.length
          } transactions, total: $${totalGenerated.toFixed(2)}`
        );
      }

      // Safety break to avoid infinite loop
      if (transactions.length > 4000) {
        console.log("⚠️  Reached 4000 transactions, stopping generation");
        break;
      }
    }

    console.log(`\n📊 Generation Summary:`);
    console.log(`   Target: $${targetAmount.toFixed(2)}`);
    console.log(`   Generated: $${totalGenerated.toFixed(2)}`);
    console.log(
      `   Accuracy: ${((totalGenerated / targetAmount) * 100).toFixed(1)}%`
    );
    console.log(`   Total Transactions: ${transactions.length}`);
    console.log(`   Card Amount Used: $${cardUsed.toFixed(2)}`);
    console.log(`   Cash Amount: $${(totalGenerated - cardUsed).toFixed(2)}`);

    // Payment method breakdown
    const paymentBreakdown = transactions.reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + 1;
      return acc;
    }, {});

    console.log(`\n💳 Payment Method Distribution:`);
    Object.entries(paymentBreakdown).forEach(([method, count]) => {
      const percentage = ((count / transactions.length) * 100).toFixed(1);
      console.log(`   ${method}: ${count} transactions (${percentage}%)`);
    });

    // Category analysis
    let lottoTotal = 0;
    let instantTotal = 0;
    const itemFrequency = {};
    let totalItems = 0;

    transactions.forEach((t) => {
      t.items.forEach((item) => {
        if (item.category === "Lotto") {
          lottoTotal += item.total;
        } else if (item.category === "Lotto instant") {
          instantTotal += item.total;
        }

        const key = `${item.category}: ${item.name}`;
        itemFrequency[key] = (itemFrequency[key] || 0) + item.quantity;
        totalItems += item.quantity;
      });
    });

    console.log(`\n💰 Category Sales Breakdown:`);
    console.log(
      `   Lotto Sales: $${lottoTotal.toFixed(2)} (${(
        (lottoTotal / totalGenerated) *
        100
      ).toFixed(1)}%)`
    );
    console.log(
      `   Instant Sales: $${instantTotal.toFixed(2)} (${(
        (instantTotal / totalGenerated) *
        100
      ).toFixed(1)}%)`
    );

    console.log(`\n📦 Transaction Analysis:`);
    console.log(`   Total tickets sold: ${totalItems}`);
    console.log(
      `   Average tickets per transaction: ${(
        totalItems / transactions.length
      ).toFixed(1)}`
    );

    // Top selling items
    const sortedItems = Object.entries(itemFrequency).sort(
      (a, b) => b[1] - a[1]
    );
    console.log(`\n🏆 Top 15 lottery items sold:`);
    sortedItems.slice(0, 15).forEach(([name, qty], index) => {
      console.log(`   ${index + 1}. ${name}: ${qty} tickets`);
    });

    // Insert transactions
    if (transactions.length > 0) {
      console.log(
        `\n💾 Inserting ${transactions.length} August lottery transactions...`
      );

      const insertResult = await transactionCollection.insertMany(transactions);
      console.log(
        `✅ Successfully inserted ${insertResult.insertedCount} transactions`
      );

      // Final verification
      const finalCardCheck = await transactionCollection
        .find({
          timestamp: {
            $gte: new Date("2025-08-01T00:00:00.000Z"),
            $lt: new Date("2025-09-01T00:00:00.000Z"),
          },
          paymentMethod: "card",
        })
        .toArray();

      const finalCardTotal = finalCardCheck.reduce(
        (sum, t) => sum + t.total,
        0
      );
      console.log(`\n💳 Final August Card Check:`);
      console.log(`   Total card amount: $${finalCardTotal.toFixed(2)}`);
      console.log(`   Card limit: $${cardLimit.toFixed(2)}`);
      console.log(
        `   Status: ${
          finalCardTotal > cardLimit ? "❌ OVER LIMIT!" : "✅ Under limit"
        }`
      );

      // Get all August sales by category
      const augustCategoryBreakdown = await transactionCollection
        .aggregate([
          {
            $match: {
              timestamp: {
                $gte: new Date("2025-08-01T00:00:00.000Z"),
                $lt: new Date("2025-09-01T00:00:00.000Z"),
              },
            },
          },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.category",
              total: { $sum: "$total" },
              transactions: { $addToSet: "$transactionId" },
            },
          },
          {
            $project: {
              category: "$_id",
              total: 1,
              transactionCount: { $size: "$transactions" },
            },
          },
          { $sort: { total: -1 } },
        ])
        .toArray();

      console.log(`\n🏁 August 2025 Sales Summary:`);
      augustCategoryBreakdown.forEach((cat) => {
        console.log(
          `   ${cat.category}: $${cat.total.toFixed(2)} (${
            cat.transactionCount
          } transactions)`
        );
      });

      console.log(`\n🎉 August 2025 lottery sales generation complete!`);
    } else {
      console.log("❌ No transactions generated");
    }
  } catch (error) {
    console.error("Error generating August lottery sales:", error);
  } finally {
    await client.close();
  }
}

generateLotterySalesAugust();
