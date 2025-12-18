const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

// Alcohol inventory items with realistic prices
const alcoholItems = [
  // Beer
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

  // Wine
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

  // Coolers/RTD
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

function getSalesMultiplier(dayOfWeek) {
  // Sunday = 0, Monday = 1, ..., Saturday = 6
  const multipliers = {
    0: 0.4, // Sunday - lowest sales
    1: 0.7, // Monday
    2: 0.8, // Tuesday
    3: 0.9, // Wednesday
    4: 1.1, // Thursday
    5: 1.5, // Friday - high sales
    6: 1.6, // Saturday - highest sales
  };
  return multipliers[dayOfWeek] || 1.0;
}

function generateTransactionTime(date) {
  // Store hours: 9 AM to 9 PM (alcohol sales restricted in many places)
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
  const itemCount = Math.random() < 0.7 ? 1 : Math.random() < 0.9 ? 2 : 3; // Most transactions have 1-2 items

  let subtotal = 0;

  for (let i = 0; i < itemCount; i++) {
    const item = getRandomItem(alcoholItems);
    const quantity = Math.random() < 0.85 ? 1 : 2; // Mostly single items
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

async function generateOctoberAlcoholSales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Check if October alcohol transactions already exist
    const existingCount = await collection.countDocuments({
      timestamp: {
        $gte: new Date("2025-10-01T00:00:00.000Z"),
        $lt: new Date("2025-11-01T00:00:00.000Z"),
      },
      "items.category": "Alcohol",
    });

    if (existingCount > 0) {
      console.log(
        `Found ${existingCount} existing October alcohol transactions.`
      );
      if (existingCount > 50) {
        console.log(
          "Significant alcohol sales data already exists. Skipping generation."
        );
        return;
      }
    }

    const transactions = [];
    let totalSales = 0;
    let transactionIdCounter = 100001; // Starting counter for October

    // Generate transactions for each day in October 2025
    for (let day = 1; day <= 31; day++) {
      const date = new Date(2025, 9, day); // Month is 0-indexed (9 = October)
      const dayOfWeek = date.getDay();
      const multiplier = getSalesMultiplier(dayOfWeek);

      // Base number of transactions per day (adjusted by day of week)
      const baseTransactions = 8; // Average transactions per day
      const dailyTransactions = Math.round(baseTransactions * multiplier);

      for (let i = 0; i < dailyTransactions; i++) {
        const transaction = generateTransaction(date, transactionIdCounter++);
        transactions.push(transaction);
        totalSales += transaction.total;
      }
    }

    // Adjust if we're significantly over or under $8000
    console.log(
      `Generated ${
        transactions.length
      } transactions with total sales of $${totalSales.toFixed(2)}`
    );

    // If we're too far from target, adjust by adding/removing some transactions
    const target = 8000;
    const tolerance = 500; // Allow $500 variance

    if (totalSales < target - tolerance) {
      // Add more transactions on high-sales days (Friday/Saturday)
      const additionalNeeded = Math.ceil((target - totalSales) / 35); // Estimate avg transaction value
      console.log(
        `Adding ${additionalNeeded} more transactions to reach target...`
      );

      for (let i = 0; i < additionalNeeded; i++) {
        // Pick a random Friday or Saturday in October
        const fridays = [2, 9, 16, 23, 30]; // Fridays in October 2025
        const saturdays = [3, 10, 17, 24, 31]; // Saturdays in October 2025
        const highSalesDays = [...fridays, ...saturdays];
        const randomDay =
          highSalesDays[Math.floor(Math.random() * highSalesDays.length)];

        const date = new Date(2025, 9, randomDay);
        const transaction = generateTransaction(date, transactionIdCounter++);
        transactions.push(transaction);
        totalSales += transaction.total;
      }
    }

    // Insert transactions into MongoDB
    if (transactions.length > 0) {
      await collection.insertMany(transactions);
      console.log(
        `✅ Successfully inserted ${transactions.length} alcohol transactions for October 2025`
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
    } else {
      console.log("No transactions to insert");
    }
  } catch (error) {
    console.error("Error generating October alcohol sales:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

// Run the script
generateOctoberAlcoholSales();
