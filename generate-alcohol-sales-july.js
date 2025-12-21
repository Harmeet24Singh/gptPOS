const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

// Alcohol inventory items with realistic prices
const alcoholItems = [
  // Beer - Summer favorites
  {
    barcode: "7123456789012",
    name: "Budweiser 24-pack",
    price: 42.99,
    category: "Alcohol",
  },
  {
    barcode: "7123456789013",
    name: "Coors Light 24-pack",
    price: 41.99,
    category: "Alcohol",
  },
  {
    barcode: "7123456789014",
    name: "Corona 6-pack",
    price: 14.99,
    category: "Alcohol",
  },
  {
    barcode: "7123456789015",
    name: "Heineken 6-pack",
    price: 16.99,
    category: "Alcohol",
  },
  {
    barcode: "7123456789016",
    name: "Molson Canadian 12-pack",
    price: 22.99,
    category: "Alcohol",
  },
  {
    barcode: "7123456789027",
    name: "Blue Light 12-pack",
    price: 21.99,
    category: "Alcohol",
  },
  {
    barcode: "7123456789028",
    name: "Stella Artois 6-pack",
    price: 15.99,
    category: "Alcohol",
  },

  // Wine - Summer selections
  {
    barcode: "7123456789017",
    name: "Red Wine Bottle",
    price: 18.99,
    category: "Alcohol",
  },
  {
    barcode: "7123456789018",
    name: "White Wine Bottle",
    price: 17.99,
    category: "Alcohol",
  },
  {
    barcode: "7123456789019",
    name: "Champagne Bottle",
    price: 35.99,
    category: "Alcohol",
  },
  {
    barcode: "7123456789029",
    name: "Rosé Wine Bottle",
    price: 19.99,
    category: "Alcohol",
  },

  // Spirits
  {
    barcode: "7123456789020",
    name: "Vodka 750ml",
    price: 29.99,
    category: "Alcohol",
  },
  {
    barcode: "7123456789021",
    name: "Whiskey 750ml",
    price: 39.99,
    category: "Alcohol",
  },
  {
    barcode: "7123456789022",
    name: "Rum 750ml",
    price: 32.99,
    category: "Alcohol",
  },
  {
    barcode: "7123456789023",
    name: "Gin 750ml",
    price: 31.99,
    category: "Alcohol",
  },
  {
    barcode: "7123456789030",
    name: "Tequila 750ml",
    price: 34.99,
    category: "Alcohol",
  },

  // Coolers/RTD - Popular in summer
  {
    barcode: "7123456789024",
    name: "Mike's Hard Lemonade 6-pack",
    price: 13.99,
    category: "Alcohol",
  },
  {
    barcode: "7123456789025",
    name: "Smirnoff Ice 6-pack",
    price: 14.99,
    category: "Alcohol",
  },
  {
    barcode: "7123456789026",
    name: "White Claw 12-pack",
    price: 24.99,
    category: "Alcohol",
  },
  {
    barcode: "7123456789031",
    name: "Twisted Tea 6-pack",
    price: 13.99,
    category: "Alcohol",
  },
  {
    barcode: "7123456789032",
    name: "Truly 12-pack",
    price: 25.99,
    category: "Alcohol",
  },
];

// Payment methods with realistic distribution
const paymentMethods = [
  { method: "credit", weight: 45 },
  { method: "debit", weight: 30 },
  { method: "cash", weight: 25 },
];

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getWeightedPaymentMethod() {
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const pm of paymentMethods) {
    cumulative += pm.weight;
    if (random <= cumulative) {
      return pm.method;
    }
  }
  return "cash";
}

function getSalesMultiplier(dayOfWeek, date) {
  // July summer multipliers - higher weekend sales due to summer activities
  const baseMultipliers = {
    0: 0.5, // Sunday
    1: 0.8, // Monday
    2: 0.9, // Tuesday
    3: 1.0, // Wednesday
    4: 1.2, // Thursday
    5: 1.7, // Friday - summer weekend start
    6: 1.8, // Saturday - peak summer day
  };

  // Special July events boost (Canada Day July 1st, summer long weekend, etc.)
  const day = date.getDate();
  let eventMultiplier = 1.0;

  if (day === 1) {
    // Canada Day
    eventMultiplier = 2.2;
  } else if (day >= 28 && day <= 31) {
    // End of July summer events
    eventMultiplier = 1.4;
  }

  return (baseMultipliers[dayOfWeek] || 1.0) * eventMultiplier;
}

function generateTransactionTime(date) {
  // Store hours: 9 AM to 9 PM (alcohol sales restricted)
  const startHour = 9;
  const endHour = 21;

  const hour = Math.floor(Math.random() * (endHour - startHour)) + startHour;
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);

  const transactionDate = new Date(date);
  transactionDate.setHours(hour, minute, second, 0);

  return transactionDate;
}

function generateTransaction(date, transactionId) {
  const items = [];
  const itemCount =
    Math.random() < 0.65
      ? 1
      : Math.random() < 0.85
      ? 2
      : Math.random() < 0.95
      ? 3
      : 4;

  let subtotal = 0;

  for (let i = 0; i < itemCount; i++) {
    const item = getRandomItem(alcoholItems);
    const quantity = Math.random() < 0.8 ? 1 : Math.random() < 0.95 ? 2 : 3;
    const itemTotal = item.price * quantity;

    items.push({
      barcode: item.barcode,
      name: item.name,
      price: item.price,
      quantity: quantity,
      total: itemTotal,
      category: item.category,
    });

    subtotal += itemTotal;
  }

  // Tax calculation (13% HST in Ontario)
  const tax = Math.round(subtotal * 0.13 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const paymentMethod = getWeightedPaymentMethod();

  return {
    transactionId: transactionId,
    timestamp: generateTransactionTime(date),
    items: items,
    subtotal: subtotal,
    tax: tax,
    total: total,
    paymentMethod: paymentMethod,
    cashier: "system",
    store: "Main Store",
  };
}

async function generateJulyAlcoholSales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Check if July alcohol transactions already exist
    const existingCount = await collection.countDocuments({
      timestamp: {
        $gte: new Date("2025-07-01T00:00:00.000Z"),
        $lt: new Date("2025-08-01T00:00:00.000Z"),
      },
      "items.category": "Alcohol",
    });

    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing July alcohol transactions.`);
      if (existingCount > 50) {
        console.log(
          "Significant alcohol sales data already exists. Skipping generation."
        );
        return;
      }
    }

    const transactions = [];
    let totalSales = 0;
    let transactionIdCounter = 70001; // Starting counter for July

    // Generate transactions for each day in July 2025
    for (let day = 1; day <= 31; day++) {
      const date = new Date(2025, 6, day); // Month is 0-indexed (6 = July)
      const dayOfWeek = date.getDay();
      const multiplier = getSalesMultiplier(dayOfWeek, date);

      // Base number of transactions per day (higher in summer)
      const baseTransactions = 12; // Higher than October due to summer activity
      const dailyTransactions = Math.round(baseTransactions * multiplier);

      for (let i = 0; i < dailyTransactions; i++) {
        const transaction = generateTransaction(date, transactionIdCounter++);
        transactions.push(transaction);
        totalSales += transaction.total;
      }
    }

    console.log(
      `Generated ${
        transactions.length
      } transactions with total sales of $${totalSales.toFixed(2)}`
    );

    // Target is $13,650 with some tolerance
    const target = 13650;
    const tolerance = 800; // Allow $800 variance

    if (totalSales < target - tolerance) {
      // Add more transactions on high-sales days
      const additionalNeeded = Math.ceil((target - totalSales) / 40); // Estimate avg transaction value
      console.log(
        `Adding ${additionalNeeded} more transactions to reach target...`
      );

      for (let i = 0; i < additionalNeeded; i++) {
        // Pick random high-sales days (weekends + Canada Day)
        const highSalesDays = [1, 4, 5, 6, 11, 12, 13, 18, 19, 20, 25, 26, 27]; // Canada Day + all weekends
        const randomDay =
          highSalesDays[Math.floor(Math.random() * highSalesDays.length)];

        const date = new Date(2025, 6, randomDay);
        const transaction = generateTransaction(date, transactionIdCounter++);
        transactions.push(transaction);
        totalSales += transaction.total;
      }
    }

    // Insert transactions into MongoDB
    if (transactions.length > 0) {
      await collection.insertMany(transactions);
      console.log(
        `✅ Successfully inserted ${transactions.length} alcohol transactions for July 2025`
      );
      console.log(`💰 Total alcohol sales: $${totalSales.toFixed(2)}`);

      // Show breakdown by week
      const weeks = {};
      transactions.forEach((t) => {
        const week = Math.ceil(t.timestamp.getDate() / 7);
        weeks[week] = (weeks[week] || 0) + t.total;
      });

      console.log("\n📊 Weekly breakdown:");
      Object.keys(weeks).forEach((week) => {
        console.log(`Week ${week}: $${weeks[week].toFixed(2)}`);
      });

      // Show breakdown by day of week
      const dayTotals = {};
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      transactions.forEach((t) => {
        const dayOfWeek = t.timestamp.getDay();
        const dayName = dayNames[dayOfWeek];
        dayTotals[dayName] = (dayTotals[dayName] || 0) + t.total;
      });

      console.log("\n📅 Sales by day of week:");
      dayNames.forEach((dayName) => {
        if (dayTotals[dayName]) {
          console.log(`${dayName}: $${dayTotals[dayName].toFixed(2)}`);
        }
      });

      // Special events breakdown
      const canadaDay = transactions.filter((t) => t.timestamp.getDate() === 1);
      const canadaDayTotal = canadaDay.reduce((sum, t) => sum + t.total, 0);

      console.log("\n🇨🇦 Special Events:");
      console.log(
        `Canada Day (July 1): $${canadaDayTotal.toFixed(2)} from ${
          canadaDay.length
        } transactions`
      );
    } else {
      console.log("No transactions to insert");
    }
  } catch (error) {
    console.error("Error generating July alcohol sales:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

// Run the script
generateJulyAlcoholSales();
