const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

// Grocery inventory items with realistic prices
const groceryItems = [
  // Dairy
  {
    barcode: "8123456789001",
    name: "Milk 2L",
    price: 4.99,
    category: "Grocery",
  },
  {
    barcode: "8123456789002",
    name: "Cheese Slices",
    price: 6.49,
    category: "Grocery",
  },
  {
    barcode: "8123456789003",
    name: "Yogurt 4-pack",
    price: 5.99,
    category: "Grocery",
  },
  {
    barcode: "8123456789004",
    name: "Butter 454g",
    price: 5.79,
    category: "Grocery",
  },
  {
    barcode: "8123456789005",
    name: "Eggs 12-pack",
    price: 4.29,
    category: "Grocery",
  },

  // Bread & Bakery
  {
    barcode: "8123456789006",
    name: "White Bread",
    price: 2.99,
    category: "Grocery",
  },
  {
    barcode: "8123456789007",
    name: "Whole Wheat Bread",
    price: 3.49,
    category: "Grocery",
  },
  {
    barcode: "8123456789008",
    name: "Bagels 6-pack",
    price: 4.99,
    category: "Grocery",
  },
  {
    barcode: "8123456789009",
    name: "Hamburger Buns",
    price: 2.79,
    category: "Grocery",
  },

  // Snacks & Chips
  {
    barcode: "8123456789010",
    name: "Lay's Chips Original",
    price: 3.99,
    category: "Grocery",
  },
  {
    barcode: "8123456789011",
    name: "Doritos Nacho",
    price: 4.49,
    category: "Grocery",
  },
  {
    barcode: "8123456789012",
    name: "Pringles Original",
    price: 2.99,
    category: "Grocery",
  },
  {
    barcode: "8123456789013",
    name: "Cheetos Crunchy",
    price: 3.79,
    category: "Grocery",
  },

  // Beverages
  {
    barcode: "8123456789014",
    name: "Coca Cola 2L",
    price: 2.99,
    category: "Grocery",
  },
  {
    barcode: "8123456789015",
    name: "Pepsi 2L",
    price: 2.99,
    category: "Grocery",
  },
  {
    barcode: "8123456789016",
    name: "Orange Juice 1L",
    price: 4.49,
    category: "Grocery",
  },
  {
    barcode: "8123456789017",
    name: "Energy Drink",
    price: 2.79,
    category: "Grocery",
  },
  {
    barcode: "8123456789018",
    name: "Water Bottle 6-pack",
    price: 4.99,
    category: "Grocery",
  },

  // Canned Goods
  {
    barcode: "8123456789019",
    name: "Campbell's Soup",
    price: 1.99,
    category: "Grocery",
  },
  {
    barcode: "8123456789020",
    name: "Tuna Can",
    price: 2.49,
    category: "Grocery",
  },
  {
    barcode: "8123456789021",
    name: "Beans Can",
    price: 1.79,
    category: "Grocery",
  },
  {
    barcode: "8123456789022",
    name: "Tomato Sauce",
    price: 1.99,
    category: "Grocery",
  },

  // Frozen Foods
  {
    barcode: "8123456789023",
    name: "Frozen Pizza",
    price: 6.99,
    category: "Grocery",
  },
  {
    barcode: "8123456789024",
    name: "Ice Cream Tub",
    price: 7.99,
    category: "Grocery",
  },
  {
    barcode: "8123456789025",
    name: "Frozen Vegetables",
    price: 3.99,
    category: "Grocery",
  },
  {
    barcode: "8123456789026",
    name: "TV Dinner",
    price: 4.49,
    category: "Grocery",
  },

  // Personal Care
  {
    barcode: "8123456789027",
    name: "Toothpaste",
    price: 4.99,
    category: "Grocery",
  },
  {
    barcode: "8123456789028",
    name: "Shampoo",
    price: 8.99,
    category: "Grocery",
  },
  {
    barcode: "8123456789029",
    name: "Soap Bar",
    price: 2.49,
    category: "Grocery",
  },
  {
    barcode: "8123456789030",
    name: "Deodorant",
    price: 5.99,
    category: "Grocery",
  },

  // Household Items
  {
    barcode: "8123456789031",
    name: "Paper Towels",
    price: 6.99,
    category: "Grocery",
  },
  {
    barcode: "8123456789032",
    name: "Toilet Paper 4-pack",
    price: 8.99,
    category: "Grocery",
  },
  {
    barcode: "8123456789033",
    name: "Laundry Detergent",
    price: 12.99,
    category: "Grocery",
  },
  {
    barcode: "8123456789034",
    name: "Dish Soap",
    price: 3.99,
    category: "Grocery",
  },
];

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
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
  // Store hours: 7 AM to 10 PM for grocery
  const startHour = 7;
  const endHour = 22;

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
    Math.random() < 0.5
      ? 1
      : Math.random() < 0.8
      ? 2
      : Math.random() < 0.95
      ? 3
      : 4; // Most 1-3 items

  let subtotal = 0;

  for (let i = 0; i < itemCount; i++) {
    const item = getRandomItem(groceryItems);
    const quantity = Math.random() < 0.9 ? 1 : 2; // Mostly single items
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

  // Payment method: 70% cash, 30% card
  const paymentMethod = Math.random() < 0.7 ? "cash" : "card";

  return {
    transactionId: transactionId,
    timestamp: generateTransactionTime(date),
    items: items,
    subtotal: subtotal,
    tax: tax,
    total: total,
    paymentBreakdown: [
      {
        method: paymentMethod,
        amount: total,
      },
    ],
    paymentMethod: paymentMethod,
    transactionType: paymentMethod,
    cashAmount: paymentMethod === "cash" ? total : 0,
    cardAmount: paymentMethod === "card" ? total : 0,
    creditAmount: 0,
    cashback: 0,
    change: 0,
    taxableAmount: subtotal,
    nonTaxableAmount: 0,
    cashier: "system",
    store: "Main Store",
  };
}

async function generateOctoberGrocerySales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Check existing October grocery transactions
    const existingTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-10-01T00:00:00.000Z"),
          $lt: new Date("2025-11-01T00:00:00.000Z"),
        },
        "items.category": "Grocery",
      })
      .toArray();

    let existingSales = 0;
    if (existingTransactions.length > 0) {
      existingTransactions.forEach((t) => (existingSales += t.total));
      console.log(
        `Found ${
          existingTransactions.length
        } existing October grocery transactions totaling $${existingSales.toFixed(
          2
        )}`
      );
    }

    const transactions = [];
    let totalSales = 0;
    let transactionIdCounter = 200001; // Starting counter for October grocery (different from alcohol)

    // Generate transactions for each day in October 2025
    for (let day = 1; day <= 31; day++) {
      const date = new Date(2025, 9, day); // Month is 0-indexed (9 = October)
      const dayOfWeek = date.getDay();
      const multiplier = getSalesMultiplier(dayOfWeek);

      // Base number of transactions per day (adjusted by day of week)
      const baseTransactions = 5; // Lower than alcohol since grocery transactions are typically larger
      const dailyTransactions = Math.round(baseTransactions * multiplier);

      for (let i = 0; i < dailyTransactions; i++) {
        const transaction = generateTransaction(date, transactionIdCounter++);
        transactions.push(transaction);
        totalSales += transaction.total;
      }
    }

    // Adjust if we're significantly over or under $5000
    console.log(
      `Generated ${
        transactions.length
      } transactions with total sales of $${totalSales.toFixed(2)}`
    );

    const target = 5000;
    const currentTotal = existingSales + totalSales;
    const tolerance = 300; // Allow $300 variance

    console.log(`Current total (existing + new): $${currentTotal.toFixed(2)}`);

    if (currentTotal < target - tolerance) {
      // Add more transactions on high-sales days (Friday/Saturday)
      const additionalNeeded = Math.ceil((target - currentTotal) / 15); // Estimate avg grocery transaction value
      console.log(
        `Adding ${additionalNeeded} more transactions to reach target...`
      );

      for (let i = 0; i < additionalNeeded; i++) {
        // Pick a random Friday or Saturday in October
        const fridays = [3, 10, 17, 24, 31]; // Fridays in October 2025
        const saturdays = [4, 11, 18, 25]; // Saturdays in October 2025
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
        `✅ Successfully inserted ${transactions.length} grocery transactions for October 2025`
      );
      console.log(`💰 Total grocery sales: $${totalSales.toFixed(2)}`);

      // Show breakdown by payment method
      let cashCount = 0;
      let cardCount = 0;
      let cashTotal = 0;
      let cardTotal = 0;

      transactions.forEach((t) => {
        if (t.paymentMethod === "cash") {
          cashCount++;
          cashTotal += t.total;
        } else {
          cardCount++;
          cardTotal += t.total;
        }
      });

      console.log(`\n💳 Payment breakdown:`);
      console.log(
        `Cash: ${cashCount} transactions (${(
          (cashCount / transactions.length) *
          100
        ).toFixed(1)}%) - $${cashTotal.toFixed(2)}`
      );
      console.log(
        `Card: ${cardCount} transactions (${(
          (cardCount / transactions.length) *
          100
        ).toFixed(1)}%) - $${cardTotal.toFixed(2)}`
      );

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
    } else {
      console.log("No transactions to insert");
    }
  } catch (error) {
    console.error("Error generating October grocery sales:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

// Run the script
generateOctoberGrocerySales();
