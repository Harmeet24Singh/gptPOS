const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function generateSeptemberAlcoholSales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Configuration for September 2025
    const TARGET_AMOUNT = 8000;
    const MONTH_START = new Date("2025-09-01T00:00:00.000Z");
    const MONTH_END = new Date("2025-10-01T00:00:00.000Z");

    console.log(
      `\n🎯 Target: $${TARGET_AMOUNT} for September 2025 alcohol sales`
    );

    // Check if September data already exists
    const existingSeptember = await collection
      .find({
        timestamp: { $gte: MONTH_START, $lt: MONTH_END },
      })
      .toArray();

    if (existingSeptember.length > 0) {
      console.log(
        `⚠️  Found ${existingSeptember.length} existing September transactions. Deleting first...`
      );
      await collection.deleteMany({
        timestamp: { $gte: MONTH_START, $lt: MONTH_END },
      });
      console.log(`✅ Cleared existing September data`);
    }

    // Calculate number of transactions needed (smaller than August for lower sales)
    const avgTransactionAmount = TARGET_AMOUNT / 220; // Fewer transactions for lower target
    const NUM_TRANSACTIONS = Math.round(TARGET_AMOUNT / avgTransactionAmount);

    console.log(
      `📊 Generating ${NUM_TRANSACTIONS} transactions with avg $${avgTransactionAmount.toFixed(
        2
      )}`
    );

    // Weekly business patterns (same as July/August)
    const dayPatterns = {
      1: 0.1, // Monday - slow (10%)
      2: 0.16, // Tuesday - good (16%)
      3: 0.16, // Wednesday - good (16%)
      4: 0.12, // Thursday - slow (12%)
      5: 0.18, // Friday - good (18%)
      6: 0.2, // Saturday - best (20%)
      0: 0.08, // Sunday - slowest (8%)
    };

    // Beer and wine items (same variety as July/August)
    const alcoholItems = [
      {
        name: "Budweiser 6-pack",
        basePrice: 12.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "Coors Light 12-pack",
        basePrice: 24.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "Corona 6-pack",
        basePrice: 15.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "Heineken 6-pack",
        basePrice: 16.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "Molson Canadian 12-pack",
        basePrice: 26.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "Miller Lite 6-pack",
        basePrice: 13.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "Labatt Blue 6-pack",
        basePrice: 14.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "Stella Artois 6-pack",
        basePrice: 17.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "Smirnoff Ice 6-pack",
        basePrice: 18.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "White Claw 12-pack",
        basePrice: 28.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "Red Wine Bottle",
        basePrice: 19.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "White Wine Bottle",
        basePrice: 17.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "Rosé Wine Bottle",
        basePrice: 21.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "Sapporo 6-pack",
        basePrice: 16.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "DAB Maibock 6-pack",
        basePrice: 18.99,
        category: "Alcohol",
        taxable: true,
      },
    ];

    // Generate all September days with patterns
    const septemberDays = [];
    for (let day = 1; day <= 30; day++) {
      const date = new Date(2025, 8, day); // Month 8 = September (0-indexed)
      const dayOfWeek = date.getDay();
      const expectedTransactions = Math.round(
        ((NUM_TRANSACTIONS * dayPatterns[dayOfWeek]) / 30) * 7
      );

      septemberDays.push({
        date: date,
        dayOfWeek: dayOfWeek,
        dayName: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ][dayOfWeek],
        expectedTransactions: expectedTransactions,
        transactions: [],
      });
    }

    console.log(`\n📅 September 2025 distribution preview:`);
    const weekSummary = {};
    septemberDays.forEach((day) => {
      if (!weekSummary[day.dayName])
        weekSummary[day.dayName] = { count: 0, total: 0 };
      weekSummary[day.dayName].count++;
      weekSummary[day.dayName].total += day.expectedTransactions;
    });

    Object.entries(weekSummary).forEach(([dayName, data]) => {
      const avg = Math.round(data.total / data.count);
      const percentage = ((data.total / NUM_TRANSACTIONS) * 100).toFixed(1);
      console.log(
        `${dayName}: ${avg} avg/day, ${data.total} total (${percentage}%)`
      );
    });

    // Generate transactions
    let currentAmount = 0;
    let transactionId = 90001; // September prefix: 9
    const allTransactions = [];

    // First pass: generate base transactions
    for (let i = 0; i < NUM_TRANSACTIONS; i++) {
      // Random item selection (1-3 items per transaction)
      const numItems = Math.random() < 0.7 ? 1 : Math.random() < 0.9 ? 2 : 3;
      const items = [];
      let subtotal = 0;

      for (let j = 0; j < numItems; j++) {
        const item =
          alcoholItems[Math.floor(Math.random() * alcoholItems.length)];
        const quantity = Math.random() < 0.8 ? 1 : 2;
        const itemTotal = item.basePrice * quantity;

        items.push({
          name: item.name,
          category: item.category,
          price: item.basePrice,
          quantity: quantity,
          total: itemTotal,
          taxable: item.taxable,
        });

        subtotal += itemTotal;
      }

      // Calculate tax (13% HST)
      const tax = Math.round(subtotal * 0.13 * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;

      allTransactions.push({
        transactionId: transactionId++,
        items: items,
        subtotal: subtotal,
        tax: tax,
        total: total,
        taxableAmount: subtotal,
        nonTaxableAmount: 0,
        includeTax: true,
        cashier: "system",
      });

      currentAmount += total;
    }

    // Adjust to hit target amount
    const currentTotal = allTransactions.reduce((sum, t) => sum + t.total, 0);
    const adjustmentFactor = TARGET_AMOUNT / currentTotal;

    console.log(
      `\n🔧 Adjusting amounts: Current $${currentTotal.toFixed(
        2
      )} → Target $${TARGET_AMOUNT}`
    );
    console.log(`📊 Adjustment factor: ${adjustmentFactor.toFixed(4)}`);

    allTransactions.forEach((transaction) => {
      const newTotal =
        Math.round(transaction.total * adjustmentFactor * 100) / 100;
      const newSubtotal = Math.round((newTotal / 1.13) * 100) / 100;
      const newTax = Math.round((newTotal - newSubtotal) * 100) / 100;

      transaction.total = newTotal;
      transaction.subtotal = newSubtotal;
      transaction.tax = newTax;
      transaction.taxableAmount = newSubtotal;

      // Adjust item prices proportionally
      const itemAdjustmentFactor =
        newSubtotal /
        transaction.items.reduce((sum, item) => sum + item.total, 0);
      transaction.items.forEach((item) => {
        const newItemTotal =
          Math.round(item.total * itemAdjustmentFactor * 100) / 100;
        item.total = newItemTotal;
        item.price = Math.round((newItemTotal / item.quantity) * 100) / 100;
      });
    });

    const finalTotal = allTransactions.reduce((sum, t) => sum + t.total, 0);
    console.log(`✅ Final total: $${finalTotal.toFixed(2)}`);

    // Payment method distribution (70% cash, 28% card, 2% mixed)
    const cashCount = Math.floor(NUM_TRANSACTIONS * 0.7);
    const cardCount = Math.floor(NUM_TRANSACTIONS * 0.28);
    const mixedCount = NUM_TRANSACTIONS - cashCount - cardCount;

    console.log(
      `\n💳 Payment distribution: ${cashCount} cash, ${cardCount} card, ${mixedCount} mixed`
    );

    // Assign payment methods and shuffle
    const paymentMethods = [];

    // Add cash payments
    for (let i = 0; i < cashCount; i++) {
      paymentMethods.push({
        paymentMethod: "cash",
        paymentBreakdown: [{ method: "cash", amount: 0 }], // Will be set to transaction total
        cashAmount: 0,
        cardAmount: 0,
        cashback: 0,
      });
    }

    // Add card payments
    for (let i = 0; i < cardCount; i++) {
      paymentMethods.push({
        paymentMethod: "card",
        paymentBreakdown: [{ method: "card", amount: 0 }],
        cashAmount: 0,
        cardAmount: 0,
        cashback: 0,
      });
    }

    // Add mixed payments
    for (let i = 0; i < mixedCount; i++) {
      paymentMethods.push({
        paymentMethod: "mixed",
        paymentBreakdown: [
          { method: "cash", amount: 0 },
          { method: "card", amount: 0 },
        ],
        cashAmount: 0,
        cardAmount: 0,
        cashback: 0,
      });
    }

    // Shuffle payment methods (Fisher-Yates)
    for (let i = paymentMethods.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [paymentMethods[i], paymentMethods[j]] = [
        paymentMethods[j],
        paymentMethods[i],
      ];
    }

    // Apply payment methods and fix amounts
    allTransactions.forEach((transaction, index) => {
      const payment = paymentMethods[index];

      if (payment.paymentMethod === "cash") {
        payment.paymentBreakdown[0].amount = transaction.total;
        payment.cashAmount = transaction.total;
      } else if (payment.paymentMethod === "card") {
        payment.paymentBreakdown[0].amount = transaction.total;
        payment.cardAmount = transaction.total;
      } else if (payment.paymentMethod === "mixed") {
        const cashRatio = 0.6 + Math.random() * 0.3; // 60-90% cash
        const cashAmount =
          Math.round(transaction.total * cashRatio * 100) / 100;
        const cardAmount =
          Math.round((transaction.total - cashAmount) * 100) / 100;

        payment.paymentBreakdown[0].amount = cashAmount;
        payment.paymentBreakdown[1].amount = cardAmount;
        payment.cashAmount = cashAmount;
        payment.cardAmount = cardAmount;
      }

      Object.assign(transaction, payment);
    });

    // Distribute transactions across days with realistic timing
    let transactionIndex = 0;

    for (const day of septemberDays) {
      const transactionsForDay = day.expectedTransactions;

      for (
        let i = 0;
        i < transactionsForDay && transactionIndex < allTransactions.length;
        i++
      ) {
        const transaction = allTransactions[transactionIndex];

        // Calculate realistic time (6 AM to 11 PM with peak hours)
        const businessStart = 6;
        const businessEnd = 23;
        const randomHour =
          businessStart + Math.random() * (businessEnd - businessStart);

        let hourMultiplier;
        // Peak hours: 7-9 AM, 12-2 PM, 5-8 PM
        if (
          (randomHour >= 7 && randomHour <= 9) ||
          (randomHour >= 12 && randomHour <= 14) ||
          (randomHour >= 17 && randomHour <= 20)
        ) {
          hourMultiplier = 0.7 + Math.random() * 0.3; // Peak: 70-100%
        } else {
          hourMultiplier = 0.3 + Math.random() * 0.4; // Off-peak: 30-70%
        }

        const finalHour = Math.floor(
          businessStart + hourMultiplier * (businessEnd - businessStart)
        );
        const minutes = Math.floor(Math.random() * 60);
        const seconds = Math.floor(Math.random() * 60);
        const milliseconds = Math.floor(Math.random() * 1000);

        const timestamp = new Date(day.date);
        timestamp.setHours(finalHour, minutes, seconds, milliseconds);

        transaction.timestamp = timestamp;
        transactionIndex++;
      }
    }

    // Insert transactions into database
    console.log(
      `\n💾 Inserting ${transactionIndex} transactions into database...`
    );

    const insertResult = await collection.insertMany(
      allTransactions.slice(0, transactionIndex)
    );

    console.log(
      `✅ Successfully inserted ${insertResult.insertedCount} September 2025 alcohol transactions`
    );

    // Verification
    const verification = await collection
      .aggregate([
        {
          $match: {
            timestamp: { $gte: MONTH_START, $lt: MONTH_END },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$total" },
            totalTransactions: { $sum: 1 },
            avgTransaction: { $avg: "$total" },
          },
        },
      ])
      .toArray();

    if (verification.length > 0) {
      const stats = verification[0];
      console.log(`\n📊 Verification Results:`);
      console.log(`Total Sales: $${stats.totalSales.toFixed(2)}`);
      console.log(`Total Transactions: ${stats.totalTransactions}`);
      console.log(`Average Transaction: $${stats.avgTransaction.toFixed(2)}`);
      console.log(
        `Target Achievement: ${(
          (stats.totalSales / TARGET_AMOUNT) *
          100
        ).toFixed(2)}%`
      );
    }

    // Payment method verification
    const paymentStats = await collection
      .aggregate([
        {
          $match: {
            timestamp: { $gte: MONTH_START, $lt: MONTH_END },
          },
        },
        {
          $group: {
            _id: "$paymentMethod",
            count: { $sum: 1 },
            totalAmount: { $sum: "$total" },
          },
        },
      ])
      .toArray();

    console.log(`\n💳 Payment method verification:`);
    paymentStats.forEach((stat) => {
      const percentage = ((stat.count / transactionIndex) * 100).toFixed(1);
      console.log(
        `${stat._id}: ${
          stat.count
        } transactions (${percentage}%) - $${stat.totalAmount.toFixed(2)}`
      );
    });
  } catch (error) {
    console.error("Error generating September alcohol sales:", error);
  } finally {
    await client.close();
    console.log("\nConnection closed");
  }
}

generateSeptemberAlcoholSales();
