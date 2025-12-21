const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function generateJulyGrocerySales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Configuration for July 2025 Grocery Sales
    const TARGET_AMOUNT = 7400;
    const MONTH_START = new Date("2025-07-01T00:00:00.000Z");
    const MONTH_END = new Date("2025-08-01T00:00:00.000Z");

    console.log(`\n🛒 Target: $${TARGET_AMOUNT} for July 2025 grocery sales`);

    // Check if July grocery data already exists
    const existingJulyGrocery = await collection
      .find({
        timestamp: { $gte: MONTH_START, $lt: MONTH_END },
        items: {
          $elemMatch: {
            category: "Grocery",
          },
        },
      })
      .toArray();

    if (existingJulyGrocery.length > 0) {
      console.log(
        `⚠️  Found ${existingJulyGrocery.length} existing July grocery transactions. Deleting first...`
      );
      await collection.deleteMany({
        timestamp: { $gte: MONTH_START, $lt: MONTH_END },
        items: {
          $elemMatch: {
            category: "Grocery",
          },
        },
      });
      console.log(`✅ Cleared existing July grocery data`);
    }

    // Comprehensive grocery/convenience store items
    const groceryItems = [
      // Fresh Produce (non-taxable)
      {
        name: "Bananas (1 lb)",
        basePrice: 1.99,
        category: "Grocery",
        taxable: false,
      },
      {
        name: "Apples (3 lb bag)",
        basePrice: 4.99,
        category: "Grocery",
        taxable: false,
      },
      {
        name: "Tomatoes (1 lb)",
        basePrice: 2.49,
        category: "Grocery",
        taxable: false,
      },
      {
        name: "Onions (2 lb bag)",
        basePrice: 2.99,
        category: "Grocery",
        taxable: false,
      },
      {
        name: "Potatoes (5 lb bag)",
        basePrice: 3.99,
        category: "Grocery",
        taxable: false,
      },

      // Dairy & Fresh (non-taxable)
      {
        name: "Whole Milk (1 gallon)",
        basePrice: 4.99,
        category: "Grocery",
        taxable: false,
      },
      {
        name: "Eggs (1 dozen)",
        basePrice: 3.49,
        category: "Grocery",
        taxable: false,
      },
      {
        name: "Butter (1 lb)",
        basePrice: 5.99,
        category: "Grocery",
        taxable: false,
      },
      {
        name: "White Bread (1 loaf)",
        basePrice: 3.99,
        category: "Grocery",
        taxable: false,
      },
      {
        name: "Cheddar Cheese (8 oz)",
        basePrice: 4.99,
        category: "Grocery",
        taxable: false,
      },

      // Pantry Staples (non-taxable)
      {
        name: "Pasta (1 lb box)",
        basePrice: 1.99,
        category: "Grocery",
        taxable: false,
      },
      {
        name: "White Rice (2 lb bag)",
        basePrice: 3.99,
        category: "Grocery",
        taxable: false,
      },
      {
        name: "Cereal (12 oz box)",
        basePrice: 4.99,
        category: "Grocery",
        taxable: false,
      },
      {
        name: "Tomato Ketchup (24 oz)",
        basePrice: 3.49,
        category: "Grocery",
        taxable: false,
      },
      {
        name: "Peanut Butter (18 oz)",
        basePrice: 4.99,
        category: "Grocery",
        taxable: false,
      },

      // Energy Drinks & Beverages (taxable)
      {
        name: "Red Bull (8.4 fl oz)",
        basePrice: 3.49,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Red Bull (12 fl oz)",
        basePrice: 4.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Red Bull Sugar Free (8.4 fl oz)",
        basePrice: 3.49,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Gatorade (20 fl oz)",
        basePrice: 2.49,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Gatorade (32 fl oz)",
        basePrice: 3.99,
        category: "Grocery",
        taxable: true,
      },

      // Cold Drinks & Water
      {
        name: "Coca Cola 2L",
        basePrice: 2.99,
        category: "Grocery",
        taxable: true,
      },
      { name: "Pepsi 2L", basePrice: 2.99, category: "Grocery", taxable: true },
      {
        name: "Sprite 2L",
        basePrice: 2.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Coca Cola Can (12 fl oz)",
        basePrice: 1.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Pepsi Can (12 fl oz)",
        basePrice: 1.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Bottled Water (16.9 fl oz)",
        basePrice: 1.49,
        category: "Grocery",
        taxable: false,
      },
      {
        name: "Water 6-pack (16.9 fl oz)",
        basePrice: 4.99,
        category: "Grocery",
        taxable: false,
      },

      // Snacks & Chips (taxable)
      {
        name: "Lay's Classic Chips (1 oz)",
        basePrice: 1.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Doritos Nacho Cheese (1 oz)",
        basePrice: 1.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Cheetos Crunchy (1 oz)",
        basePrice: 1.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Pringles Original (5.5 oz)",
        basePrice: 2.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Mixed Nuts (6 oz)",
        basePrice: 4.99,
        category: "Grocery",
        taxable: true,
      },

      // Candy & Sweets (taxable)
      {
        name: "Snickers Bar",
        basePrice: 1.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Kit Kat Bar",
        basePrice: 1.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "M&M's Peanut",
        basePrice: 2.49,
        category: "Grocery",
        taxable: true,
      },
      { name: "Skittles", basePrice: 1.99, category: "Grocery", taxable: true },
      {
        name: "Haribo Gummy Bears",
        basePrice: 2.99,
        category: "Grocery",
        taxable: true,
      },

      // Biscuits & Cookies (taxable)
      {
        name: "Oreo Cookies (14.3 oz)",
        basePrice: 4.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Chips Ahoy Cookies (13 oz)",
        basePrice: 4.49,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Digestive Biscuits",
        basePrice: 3.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Graham Crackers",
        basePrice: 3.49,
        category: "Grocery",
        taxable: true,
      },

      // Household Items (taxable)
      {
        name: "Scotch Tape Roll",
        basePrice: 2.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Duct Tape Roll",
        basePrice: 5.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Candles (pack of 4)",
        basePrice: 3.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Birthday Candles (pack of 24)",
        basePrice: 2.49,
        category: "Grocery",
        taxable: true,
      },

      // Cards & Games (taxable)
      {
        name: "Playing Cards (Standard Deck)",
        basePrice: 3.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Birthday Greeting Card",
        basePrice: 4.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Thank You Card",
        basePrice: 3.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Get Well Card",
        basePrice: 3.99,
        category: "Grocery",
        taxable: true,
      },

      // Stationery (taxable)
      {
        name: "Blue Pen (pack of 3)",
        basePrice: 2.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Black Pen (pack of 3)",
        basePrice: 2.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Pencils (pack of 6)",
        basePrice: 2.49,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Notebook (80 pages)",
        basePrice: 3.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Sticky Notes",
        basePrice: 2.99,
        category: "Grocery",
        taxable: true,
      },

      // Electronics & Accessories (taxable)
      {
        name: "USB Cable (3 ft)",
        basePrice: 9.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Lightning Cable (3 ft)",
        basePrice: 12.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Phone Charger (Wall Adapter)",
        basePrice: 14.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Car Charger (USB)",
        basePrice: 11.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Earbuds (Basic)",
        basePrice: 8.99,
        category: "Grocery",
        taxable: true,
      },

      // Ice Cream & Frozen (taxable)
      {
        name: "Ice Cream Sandwich (pack of 6)",
        basePrice: 4.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Popsicles (pack of 8)",
        basePrice: 3.99,
        category: "Grocery",
        taxable: true,
      },
      {
        name: "Ben & Jerry's Pint",
        basePrice: 6.99,
        category: "Grocery",
        taxable: true,
      },
    ];

    // Calculate number of transactions needed
    const avgTransactionAmount = TARGET_AMOUNT / 250; // More transactions for grocery
    const NUM_TRANSACTIONS = Math.round(TARGET_AMOUNT / avgTransactionAmount);

    console.log(
      `📊 Generating ${NUM_TRANSACTIONS} transactions with avg $${avgTransactionAmount.toFixed(
        2
      )}`
    );

    // Weekly business patterns (same as alcohol)
    const dayPatterns = {
      1: 0.1, // Monday - slow (10%)
      2: 0.16, // Tuesday - good (16%)
      3: 0.16, // Wednesday - good (16%)
      4: 0.12, // Thursday - slow (12%)
      5: 0.18, // Friday - good (18%)
      6: 0.2, // Saturday - best (20%)
      0: 0.08, // Sunday - slowest (8%)
    };

    // Generate all July days with patterns
    const julyDays = [];
    for (let day = 1; day <= 31; day++) {
      const date = new Date(2025, 6, day); // Month 6 = July (0-indexed)
      const dayOfWeek = date.getDay();
      const expectedTransactions = Math.round(
        ((NUM_TRANSACTIONS * dayPatterns[dayOfWeek]) / 31) * 7
      );

      julyDays.push({
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

    console.log(`\n📅 July 2025 grocery distribution preview:`);
    const weekSummary = {};
    julyDays.forEach((day) => {
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
    let transactionId = 70001; // July grocery prefix: 7
    const allTransactions = [];

    // First pass: generate base transactions
    for (let i = 0; i < NUM_TRANSACTIONS; i++) {
      // Grocery transactions typically have more items (2-5 items per transaction)
      const numItems =
        Math.random() < 0.4
          ? 2
          : Math.random() < 0.7
          ? 3
          : Math.random() < 0.9
          ? 4
          : 5;
      const items = [];
      let subtotal = 0;
      let taxableAmount = 0;
      let nonTaxableAmount = 0;

      for (let j = 0; j < numItems; j++) {
        const item =
          groceryItems[Math.floor(Math.random() * groceryItems.length)];
        const quantity = Math.random() < 0.7 ? 1 : Math.random() < 0.9 ? 2 : 3;
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
        if (item.taxable) {
          taxableAmount += itemTotal;
        } else {
          nonTaxableAmount += itemTotal;
        }
      }

      // Calculate tax (13% HST on taxable items only)
      const tax = Math.round(taxableAmount * 0.13 * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;

      allTransactions.push({
        transactionId: transactionId++,
        items: items,
        subtotal: subtotal,
        tax: tax,
        total: total,
        taxableAmount: taxableAmount,
        nonTaxableAmount: nonTaxableAmount,
        includeTax: true,
        cashier: "system",
      });
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
      const newTaxableAmount =
        Math.round(transaction.taxableAmount * adjustmentFactor * 100) / 100;
      const newNonTaxableAmount =
        Math.round(transaction.nonTaxableAmount * adjustmentFactor * 100) / 100;
      const newSubtotal = newTaxableAmount + newNonTaxableAmount;
      const newTax = Math.round(newTaxableAmount * 0.13 * 100) / 100;

      transaction.total = newTotal;
      transaction.subtotal = newSubtotal;
      transaction.tax = newTax;
      transaction.taxableAmount = newTaxableAmount;
      transaction.nonTaxableAmount = newNonTaxableAmount;

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
        paymentBreakdown: [{ method: "cash", amount: 0 }],
        cashAmount: 0,
        cardAmount: 0,
        cashback: 0,
        unpaid: 0,
        change: 0,
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
        unpaid: 0,
        change: 0,
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
        unpaid: 0,
        change: 0,
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

    for (const day of julyDays) {
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

        let hour;
        const rand = Math.random();

        if (rand < 0.3) {
          // Peak morning (7-9 AM)
          hour = 7 + Math.random() * 2;
        } else if (rand < 0.5) {
          // Peak lunch (12-2 PM)
          hour = 12 + Math.random() * 2;
        } else if (rand < 0.7) {
          // Peak evening (5-8 PM)
          hour = 17 + Math.random() * 3;
        } else {
          // Regular hours
          hour = businessStart + Math.random() * (businessEnd - businessStart);
        }

        const finalHour = Math.floor(hour);
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
      `✅ Successfully inserted ${insertResult.insertedCount} July 2025 grocery transactions`
    );

    // Verification
    const verification = await collection
      .aggregate([
        {
          $match: {
            timestamp: { $gte: MONTH_START, $lt: MONTH_END },
            items: {
              $elemMatch: {
                category: "Grocery",
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$total" },
            totalTransactions: { $sum: 1 },
            avgTransaction: { $avg: "$total" },
            totalTax: { $sum: "$tax" },
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
      console.log(`Total Tax: $${stats.totalTax.toFixed(2)}`);
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
            items: {
              $elemMatch: {
                category: "Grocery",
              },
            },
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
    console.error("Error generating July grocery sales:", error);
  } finally {
    await client.close();
    console.log("\nConnection closed");
  }
}

generateJulyGrocerySales();
