const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function generateNovemberGrocerySales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Configuration for November 2025
    const TARGET_AMOUNT = 3100;
    const BASE_TRANSACTION_ID = 110800; // November grocery: 1108xx

    console.log(
      `\n🎯 Target: $${TARGET_AMOUNT} for November 2025 grocery sales`
    );

    // Check if November grocery data already exists
    const existingNovember = await collection
      .find({
        transactionId: {
          $gte: BASE_TRANSACTION_ID,
          $lt: BASE_TRANSACTION_ID + 1000,
        },
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
      })
      .toArray();

    if (existingNovember.length > 0) {
      console.log(
        `⚠️  Found ${existingNovember.length} existing November grocery transactions. Deleting first...`
      );
      await collection.deleteMany({
        transactionId: {
          $gte: BASE_TRANSACTION_ID,
          $lt: BASE_TRANSACTION_ID + 1000,
        },
      });
      console.log(`✅ Cleared existing November grocery data`);
    }

    // Grocery items with realistic pricing (November seasonal focus)
    const groceryItems = [
      // Beverages
      { name: "Hot Chocolate Mix 250g", price: 4.99, category: "Grocery" },
      { name: "Coffee Premium Blend", price: 8.99, category: "Grocery" },
      { name: "Tea Winterberry 24ct", price: 5.99, category: "Grocery" },
      { name: "Apple Cider 1L", price: 4.99, category: "Grocery" },
      { name: "Orange Juice 1L", price: 3.49, category: "Grocery" },
      { name: "Water Bottle 500ml", price: 1.29, category: "Grocery" },
      { name: "Energy Drink 250ml", price: 2.99, category: "Grocery" },

      // November/Winter seasonal items
      { name: "Thanksgiving Turkey Gravy", price: 3.99, category: "Grocery" },
      { name: "Cranberry Sauce 250ml", price: 2.99, category: "Grocery" },
      { name: "Pumpkin Pie Spice", price: 4.49, category: "Grocery" },
      { name: "Stuffing Mix 120g", price: 2.79, category: "Grocery" },
      { name: "Winter Soup Mix", price: 3.99, category: "Grocery" },
      { name: "Holiday Cookies 300g", price: 5.99, category: "Grocery" },
      { name: "Mulled Cider Mix", price: 3.49, category: "Grocery" },
      { name: "Comfort Food Kit", price: 12.99, category: "Grocery" },

      // Snacks & Comfort Foods
      { name: "Potato Chips 200g", price: 4.49, category: "Grocery" },
      { name: "Chocolate Bar Dark 85g", price: 2.49, category: "Grocery" },
      { name: "Cookies Gingerbread", price: 4.99, category: "Grocery" },
      { name: "Nuts Roasted Mix 200g", price: 6.99, category: "Grocery" },
      { name: "Granola Bars 8pk", price: 5.29, category: "Grocery" },
      { name: "Candy Canes 12pk", price: 2.99, category: "Grocery" },

      // Basic Groceries
      { name: "Bread Whole Wheat", price: 3.29, category: "Grocery" },
      { name: "Milk 2% 1L", price: 3.79, category: "Grocery" },
      { name: "Eggs Large 12pk", price: 5.49, category: "Grocery" },
      { name: "Butter Salted 454g", price: 6.99, category: "Grocery" },
      { name: "Cheese Cheddar 250g", price: 6.49, category: "Grocery" },
      { name: "Yogurt Greek 650g", price: 4.99, category: "Grocery" },
      { name: "Cereal Oatmeal 500g", price: 4.99, category: "Grocery" },
      { name: "Pasta Whole Grain 500g", price: 3.49, category: "Grocery" },
      { name: "Rice Brown 1kg", price: 4.49, category: "Grocery" },
      { name: "Soup Chicken Noodle", price: 2.49, category: "Grocery" },

      // Household essentials
      { name: "Toilet Paper 12pk", price: 11.99, category: "Grocery" },
      { name: "Paper Towels 4pk", price: 7.99, category: "Grocery" },
      { name: "Dish Soap Winter Scent", price: 4.49, category: "Grocery" },
      { name: "Laundry Detergent 1.5L", price: 9.99, category: "Grocery" },
      { name: "Air Freshener Winter", price: 3.99, category: "Grocery" },

      // Personal Care (winter focused)
      { name: "Hand Cream Winter 100ml", price: 4.99, category: "Grocery" },
      { name: "Lip Balm 4.5g", price: 2.99, category: "Grocery" },
      { name: "Vitamins C 60ct", price: 12.99, category: "Grocery" },
      { name: "Throat Lozenges 24ct", price: 5.99, category: "Grocery" },
    ];

    // Generate all November days with patterns
    const novemberDays = [];
    for (let day = 1; day <= 30; day++) {
      const date = new Date(2025, 10, day); // Month 10 = November (0-indexed)
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // November patterns: Thanksgiving preparation (higher mid-month), colder weather affects shopping
      let multiplier = 1.0;
      if (day >= 20 && day <= 27) {
        multiplier = 1.5; // Thanksgiving week higher sales
      } else if (day >= 15 && day <= 19) {
        multiplier = 1.2; // Pre-Thanksgiving preparation
      } else if (dayOfWeek === 0 || dayOfWeek === 6) {
        multiplier = 1.1; // Smaller weekend boost in colder weather
      } else {
        multiplier = 0.9; // Slightly lower weekday sales in November
      }

      novemberDays.push({
        date: day,
        dayOfWeek: dayOfWeek,
        multiplier: multiplier,
        fullDate: date,
      });
    }

    console.log(`\n📅 November 2025 grocery distribution preview:`);
    const averagePerDay = TARGET_AMOUNT / 30;
    novemberDays.slice(0, 7).forEach((day) => {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const expectedAmount = averagePerDay * day.multiplier;
      console.log(
        `  ${dayNames[day.dayOfWeek]} Nov ${
          day.date
        }: ~$${expectedAmount.toFixed(2)} (${day.multiplier}x)`
      );
    });

    // Calculate transactions needed (lower count for November)
    const totalTransactionsNeeded = Math.round(30 * 3); // ~90 transactions
    const averageTransactionValue = TARGET_AMOUNT / totalTransactionsNeeded;

    console.log(
      `\n📊 Planning ${totalTransactionsNeeded} transactions at ~$${averageTransactionValue.toFixed(
        2
      )} average`
    );

    let transactionId = BASE_TRANSACTION_ID;
    let runningTotal = 0;
    const transactions = [];

    // Generate transactions for each day
    for (const day of novemberDays) {
      const targetDayAmount = (TARGET_AMOUNT / 30) * day.multiplier;
      const transactionsForDay = Math.max(2, Math.round(3 * day.multiplier)); // 2-5 transactions per day

      let dayTotal = 0;

      for (let i = 0; i < transactionsForDay; i++) {
        const remainingForDay = targetDayAmount - dayTotal;
        const remainingTransactions = transactionsForDay - i;
        let targetTransactionAmount = remainingForDay / remainingTransactions;

        // Add some randomness (±25%)
        targetTransactionAmount *= 0.75 + Math.random() * 0.5;
        targetTransactionAmount = Math.max(
          10,
          Math.min(65, targetTransactionAmount)
        ); // $10-$65 range

        // Generate items for this transaction
        const items = [];
        let transactionSubtotal = 0;
        const itemCount = Math.floor(Math.random() * 4) + 1; // 1-4 items (fewer items in winter)

        for (let j = 0; j < itemCount; j++) {
          const item =
            groceryItems[Math.floor(Math.random() * groceryItems.length)];
          const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity (smaller baskets)
          const itemTotal = item.price * quantity;

          items.push({
            name: item.name,
            price: item.price,
            quantity: quantity,
            category: item.category,
            total: itemTotal,
          });

          transactionSubtotal += itemTotal;
        }

        // Calculate tax (13% HST)
        const tax = transactionSubtotal * 0.13;
        const total = transactionSubtotal + tax;

        // Random time during business hours (7 AM - 10 PM, shorter November days)
        const hour = Math.floor(Math.random() * 15) + 7; // 7-21 (7 AM - 9 PM)
        const minute = Math.floor(Math.random() * 60);
        const timestamp = new Date(2025, 10, day.date, hour, minute);

        // Payment methods (more cash in November due to holiday preparation)
        const paymentMethods = ["cash", "cash", "card", "card"]; // 50/50 split
        const paymentMethod =
          paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

        const transaction = {
          transactionId: transactionId++,
          items: items,
          subtotal: Math.round(transactionSubtotal * 100) / 100,
          tax: Math.round(tax * 100) / 100,
          total: Math.round(total * 100) / 100,
          paymentMethod: paymentMethod,
          timestamp: timestamp,
          cashier: "Admin User",
          receiptNumber: `RCP${transactionId}`,
          createdAt: timestamp,
          transactionType: paymentMethod,
        };

        transactions.push(transaction);
        dayTotal += total;
        runningTotal += total;
      }
    }

    console.log(
      `\n📈 Generated ${
        transactions.length
      } grocery transactions totaling $${runningTotal.toFixed(2)}`
    );
    console.log(
      `🎯 Target was $${TARGET_AMOUNT}, variance: ${(
        ((runningTotal - TARGET_AMOUNT) / TARGET_AMOUNT) *
        100
      ).toFixed(1)}%`
    );

    // Insert all transactions
    const insertResult = await collection.insertMany(transactions);
    console.log(
      `✅ Successfully inserted ${insertResult.insertedCount} November 2025 grocery transactions`
    );

    // Verify the results
    const verification = await collection
      .find({
        transactionId: { $gte: BASE_TRANSACTION_ID, $lt: transactionId },
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
      })
      .toArray();

    const totalAmount = verification.reduce((sum, t) => sum + t.total, 0);
    const groceryItemsCount = verification.reduce(
      (sum, t) =>
        sum +
        t.items
          .filter((item) => item.category === "Grocery")
          .reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    console.log(`\n📊 Verification:`);
    console.log(`   💰 Total Sales: $${totalAmount.toFixed(2)}`);
    console.log(`   🛒 Transactions: ${verification.length}`);
    console.log(`   📦 Grocery Items Sold: ${groceryItemsCount}`);
    console.log(
      `   💳 Average Transaction: $${(
        totalAmount / verification.length
      ).toFixed(2)}`
    );

    // Payment method breakdown
    const paymentBreakdown = verification.reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + 1;
      return acc;
    }, {});

    console.log(`\n💳 Payment Methods:`);
    Object.entries(paymentBreakdown).forEach(([method, count]) => {
      const percentage = ((count / verification.length) * 100).toFixed(1);
      console.log(`   ${method}: ${count} (${percentage}%)`);
    });

    // Seasonal analysis
    const thanksgivingWeek = verification.filter((t) => {
      const day = new Date(t.timestamp).getDate();
      return day >= 20 && day <= 27;
    });
    console.log(
      `\n🦃 Thanksgiving Week (Nov 20-27): ${
        thanksgivingWeek.length
      } transactions, $${thanksgivingWeek
        .reduce((sum, t) => sum + t.total, 0)
        .toFixed(2)}`
    );
  } catch (error) {
    console.error("Error generating November grocery sales:", error);
  } finally {
    await client.close();
  }
}

generateNovemberGrocerySales();
