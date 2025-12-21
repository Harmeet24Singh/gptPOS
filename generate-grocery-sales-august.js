const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function generateAugustGrocerySales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Configuration for August 2025
    const TARGET_AMOUNT = 6300;
    const BASE_TRANSACTION_ID = 80800; // August grocery: 808xx

    console.log(`\n🎯 Target: $${TARGET_AMOUNT} for August 2025 grocery sales`);

    // Check if August grocery data already exists
    const existingAugust = await collection
      .find({
        transactionId: {
          $gte: BASE_TRANSACTION_ID,
          $lt: BASE_TRANSACTION_ID + 1000,
        },
        timestamp: {
          $gte: new Date("2025-08-01T00:00:00.000Z"),
          $lt: new Date("2025-09-01T00:00:00.000Z"),
        },
      })
      .toArray();

    if (existingAugust.length > 0) {
      console.log(
        `⚠️  Found ${existingAugust.length} existing August grocery transactions. Deleting first...`
      );
      await collection.deleteMany({
        transactionId: {
          $gte: BASE_TRANSACTION_ID,
          $lt: BASE_TRANSACTION_ID + 1000,
        },
      });
      console.log(`✅ Cleared existing August grocery data`);
    }

    // Grocery items with realistic pricing
    const groceryItems = [
      // Beverages
      { name: "Coca Cola 355ml", price: 1.99, category: "Grocery" },
      { name: "Pepsi 355ml", price: 1.99, category: "Grocery" },
      { name: "Orange Juice 1L", price: 3.49, category: "Grocery" },
      { name: "Apple Juice 1L", price: 3.29, category: "Grocery" },
      { name: "Water Bottle 500ml", price: 1.29, category: "Grocery" },
      { name: "Energy Drink 250ml", price: 2.99, category: "Grocery" },
      { name: "Coffee 454g", price: 7.99, category: "Grocery" },
      { name: "Tea Bags 72ct", price: 4.99, category: "Grocery" },

      // Snacks
      { name: "Potato Chips 200g", price: 4.49, category: "Grocery" },
      { name: "Chocolate Bar 43g", price: 1.79, category: "Grocery" },
      { name: "Cookies 300g", price: 3.99, category: "Grocery" },
      { name: "Nuts Mixed 150g", price: 5.99, category: "Grocery" },
      { name: "Granola Bar 6pk", price: 4.29, category: "Grocery" },
      { name: "Candy 100g", price: 2.49, category: "Grocery" },

      // Basic Groceries
      { name: "Bread Loaf", price: 2.79, category: "Grocery" },
      { name: "Milk 1L", price: 3.79, category: "Grocery" },
      { name: "Eggs 12pk", price: 4.99, category: "Grocery" },
      { name: "Butter 454g", price: 6.49, category: "Grocery" },
      { name: "Cheese Sliced 250g", price: 5.99, category: "Grocery" },
      { name: "Yogurt 650g", price: 4.49, category: "Grocery" },
      { name: "Cereal 400g", price: 6.99, category: "Grocery" },
      { name: "Pasta 500g", price: 2.99, category: "Grocery" },
      { name: "Rice 1kg", price: 3.99, category: "Grocery" },
      { name: "Soup Can 284ml", price: 1.99, category: "Grocery" },
      { name: "Tuna Can 170g", price: 2.49, category: "Grocery" },

      // Household
      { name: "Toilet Paper 8pk", price: 8.99, category: "Grocery" },
      { name: "Paper Towels 2pk", price: 5.49, category: "Grocery" },
      { name: "Dish Soap 532ml", price: 3.99, category: "Grocery" },
      { name: "Laundry Detergent 1L", price: 7.99, category: "Grocery" },
      { name: "Garbage Bags 40pk", price: 6.99, category: "Grocery" },

      // Personal Care
      { name: "Toothpaste 100ml", price: 3.49, category: "Grocery" },
      { name: "Shampoo 400ml", price: 6.99, category: "Grocery" },
      { name: "Soap Bar 90g", price: 1.99, category: "Grocery" },
      { name: "Deodorant 85g", price: 4.99, category: "Grocery" },
    ];

    // Generate all August days with patterns
    const augustDays = [];
    for (let day = 1; day <= 31; day++) {
      const date = new Date(2025, 7, day); // Month 7 = August (0-indexed)
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Weekend multiplier for grocery sales (higher on weekends)
      const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.3 : 1.0;

      augustDays.push({
        date: day,
        dayOfWeek: dayOfWeek,
        multiplier: weekendMultiplier,
        fullDate: date,
      });
    }

    console.log(`\n📅 August 2025 grocery distribution preview:`);
    const averagePerDay = TARGET_AMOUNT / 31;
    augustDays.slice(0, 7).forEach((day) => {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const expectedAmount = averagePerDay * day.multiplier;
      console.log(
        `  ${dayNames[day.dayOfWeek]} Aug ${
          day.date
        }: ~$${expectedAmount.toFixed(2)} (${day.multiplier}x)`
      );
    });

    // Calculate transactions needed (roughly 3-5 transactions per day)
    const totalTransactionsNeeded = Math.round(31 * 4); // ~124 transactions
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
    for (const day of augustDays) {
      const targetDayAmount = (TARGET_AMOUNT / 31) * day.multiplier;
      const transactionsForDay = Math.max(2, Math.round(4 * day.multiplier)); // 2-5 transactions per day

      let dayTotal = 0;

      for (let i = 0; i < transactionsForDay; i++) {
        const remainingForDay = targetDayAmount - dayTotal;
        const remainingTransactions = transactionsForDay - i;
        let targetTransactionAmount = remainingForDay / remainingTransactions;

        // Add some randomness (±30%)
        targetTransactionAmount *= 0.7 + Math.random() * 0.6;
        targetTransactionAmount = Math.max(
          5,
          Math.min(80, targetTransactionAmount)
        ); // $5-$80 range

        // Generate items for this transaction
        const items = [];
        let transactionSubtotal = 0;
        const itemCount = Math.floor(Math.random() * 6) + 1; // 1-6 items

        for (let j = 0; j < itemCount; j++) {
          const item =
            groceryItems[Math.floor(Math.random() * groceryItems.length)];
          const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
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

        // Random time during business hours (6 AM - 11 PM)
        const hour = Math.floor(Math.random() * 17) + 6; // 6-22 (6 AM - 10 PM)
        const minute = Math.floor(Math.random() * 60);
        const timestamp = new Date(2025, 7, day.date, hour, minute);

        // Payment methods (grocery tends to be more cash/card mix)
        const paymentMethods = ["cash", "card", "card", "card"]; // 75% card, 25% cash
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
      `✅ Successfully inserted ${insertResult.insertedCount} August 2025 grocery transactions`
    );

    // Verify the results
    const verification = await collection
      .find({
        transactionId: { $gte: BASE_TRANSACTION_ID, $lt: transactionId },
        timestamp: {
          $gte: new Date("2025-08-01T00:00:00.000Z"),
          $lt: new Date("2025-09-01T00:00:00.000Z"),
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
  } catch (error) {
    console.error("Error generating August grocery sales:", error);
  } finally {
    await client.close();
  }
}

// Run the generator
generateAugustGrocerySales();
