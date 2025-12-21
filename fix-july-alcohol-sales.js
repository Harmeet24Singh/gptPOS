const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

// Only beer and wine items (no hard liquor allowed)
const allowedAlcoholItems = [
  // Beer items
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

  // Wine items
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
    barcode: "7123456789029",
    name: "Rosé Wine Bottle",
    price: 19.99,
    category: "Alcohol",
  },
];

// Payment methods with correct distribution
const paymentMethods = [
  { method: "cash", weight: 70 },
  { method: "credit", weight: 20 },
  { method: "debit", weight: 10 },
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
  const baseMultipliers = {
    0: 0.5, // Sunday
    1: 0.8, // Monday
    2: 0.9, // Tuesday
    3: 1.0, // Wednesday
    4: 1.2, // Thursday
    5: 1.7, // Friday
    6: 1.8, // Saturday
  };

  const day = date.getDate();
  let eventMultiplier = 1.0;

  if (day === 1) {
    // Canada Day
    eventMultiplier = 2.2;
  } else if (day >= 28 && day <= 31) {
    eventMultiplier = 1.4;
  }

  return (baseMultipliers[dayOfWeek] || 1.0) * eventMultiplier;
}

function generateTransactionTime(date) {
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
    const item = getRandomItem(allowedAlcoholItems);
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

async function fixJulyAlcoholSales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Step 1: Remove ALL July transactions (both alcohol and tobacco)
    console.log("\n🗑️  Removing all existing July transactions...");
    const deleteResult = await collection.deleteMany({
      timestamp: {
        $gte: new Date("2025-07-01T00:00:00.000Z"),
        $lt: new Date("2025-08-01T00:00:00.000Z"),
      },
    });
    console.log(`✅ Removed ${deleteResult.deletedCount} transactions`);

    // Step 2: Generate fresh July alcohol transactions with correct items and payment methods
    console.log("\n🔧 Generating fresh July alcohol transactions...");
    const transactions = [];
    let totalSales = 0;
    let transactionIdCounter = 70001;

    for (let day = 1; day <= 31; day++) {
      const date = new Date(2025, 6, day);
      const dayOfWeek = date.getDay();
      const multiplier = getSalesMultiplier(dayOfWeek, date);
      const baseTransactions = 12;
      const dailyTransactions = Math.round(baseTransactions * multiplier);

      for (let i = 0; i < dailyTransactions; i++) {
        const transaction = generateTransaction(date, transactionIdCounter++);
        transactions.push(transaction);
        totalSales += transaction.total;
      }
    }

    // Step 3: Adjust to target $13,650
    const target = 13650;
    if (totalSales < target - 500) {
      const additionalNeeded = Math.ceil((target - totalSales) / 40);
      console.log(
        `Adding ${additionalNeeded} more transactions to reach target...`
      );

      for (let i = 0; i < additionalNeeded; i++) {
        const highSalesDays = [1, 4, 5, 6, 11, 12, 13, 18, 19, 20, 25, 26, 27];
        const randomDay =
          highSalesDays[Math.floor(Math.random() * highSalesDays.length)];
        const date = new Date(2025, 6, randomDay);
        const transaction = generateTransaction(date, transactionIdCounter++);
        transactions.push(transaction);
        totalSales += transaction.total;
      }
    }

    // Step 4: Insert new transactions
    if (transactions.length > 0) {
      await collection.insertMany(transactions);
      console.log(
        `✅ Inserted ${transactions.length} new PURE ALCOHOL transactions`
      );
      console.log(`💰 Total alcohol sales: $${totalSales.toFixed(2)}`);

      // Payment method breakdown
      const paymentBreakdown = {};
      transactions.forEach((t) => {
        paymentBreakdown[t.paymentMethod] =
          (paymentBreakdown[t.paymentMethod] || 0) + 1;
      });

      console.log(`\n💳 Payment method distribution:`);
      Object.entries(paymentBreakdown).forEach(([method, count]) => {
        const percentage = ((count / transactions.length) * 100).toFixed(1);
        console.log(`${method}: ${count} transactions (${percentage}%)`);
      });

      // Item breakdown
      const itemBreakdown = {};
      transactions.forEach((t) => {
        t.items.forEach((item) => {
          itemBreakdown[item.name] =
            (itemBreakdown[item.name] || 0) + item.quantity;
        });
      });

      console.log(`\n🍺🍷 Items sold:`);
      Object.entries(itemBreakdown)
        .sort()
        .forEach(([name, quantity]) => {
          console.log(`${name}: ${quantity} units`);
        });

      console.log(
        `\n✅ SUCCESS: July now contains ONLY alcohol transactions (beer & wine)`
      );
      console.log(`🚫 NO tobacco, hard liquor, or other categories`);
      console.log(`💰 Payment methods: ~70% cash, ~30% card`);
    }
  } catch (error) {
    console.error("Error fixing July alcohol sales:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

// Run the script
fixJulyAlcoholSales();
