const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function generateSeptemberGrocerySales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Configuration for September 2025
    const TARGET_AMOUNT = 4200;
    const BASE_TRANSACTION_ID = 90800; // September grocery: 908xx

    console.log(
      `\n🎯 Target: $${TARGET_AMOUNT} for September 2025 grocery sales`
    );

    // Check if September grocery data already exists
    const existingSeptember = await collection
      .find({
        transactionId: {
          $gte: BASE_TRANSACTION_ID,
          $lt: BASE_TRANSACTION_ID + 1000,
        },
        timestamp: {
          $gte: new Date("2025-09-01T00:00:00.000Z"),
          $lt: new Date("2025-10-01T00:00:00.000Z"),
        },
      })
      .toArray();

    if (existingSeptember.length > 0) {
      console.log(
        `⚠️  Found ${existingSeptember.length} existing September grocery transactions. Deleting first...`
      );
      await collection.deleteMany({
        transactionId: {
          $gte: BASE_TRANSACTION_ID,
          $lt: BASE_TRANSACTION_ID + 1000,
        },
      });
      console.log(`✅ Cleared existing September grocery data`);
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

      // September seasonal items
      { name: "Back to School Lunch Kit", price: 12.99, category: "Grocery" },
      { name: "Seasonal Coffee Blend", price: 9.99, category: "Grocery" },
      { name: "Apple Cider 1L", price: 4.99, category: "Grocery" },
      { name: "Pumpkin Spice Cookies", price: 5.99, category: "Grocery" },
      { name: "Autumn Trail Mix", price: 7.99, category: "Grocery" },

      // Household essentials
      { name: "Toilet Paper 8pk", price: 8.99, category: "Grocery" },
      { name: "Paper Towels 2pk", price: 5.49, category: "Grocery" },
      { name: "Dish Soap 532ml", price: 3.99, category: "Grocery" },
      { name: "Laundry Detergent 1L", price: 7.99, category: "Grocery" },
      { name: "All-Purpose Cleaner", price: 4.99, category: "Grocery" },

      // Personal Care
      { name: "Toothpaste 100ml", price: 3.49, category: "Grocery" },
      { name: "Shampoo 400ml", price: 6.99, category: "Grocery" },
      { name: "Hand Sanitizer 250ml", price: 3.99, category: "Grocery" },
      { name: "Vitamins 30ct", price: 8.99, category: "Grocery" },
    ];

    // Generate all September days with patterns
    const septemberDays = [];
    for (let day = 1; day <= 30; day++) {
      const date = new Date(2025, 8, day); // Month 8 = September (0-indexed)
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // September patterns: back-to-school season (higher early September), then normal
      let multiplier = 1.0;
      if (day <= 7) {
        multiplier = 1.4; // Higher sales first week (back to school)
      } else if (dayOfWeek === 0 || dayOfWeek === 6) {
        multiplier = 1.2; // Weekend boost
      }

      septemberDays.push({
        date: day,
        dayOfWeek: dayOfWeek,
        multiplier: multiplier,
        fullDate: date,
      });
    }

    console.log(`\n📅 September 2025 grocery distribution preview:`);
    const averagePerDay = TARGET_AMOUNT / 30;
    septemberDays.slice(0, 7).forEach((day) => {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const expectedAmount = averagePerDay * day.multiplier;
      console.log(
        `  ${dayNames[day.dayOfWeek]} Sep ${
          day.date
        }: ~$${expectedAmount.toFixed(2)} (${day.multiplier}x)`
      );
    });

    // Calculate transactions needed (targeting lower transaction count for $4200)
    const totalTransactionsNeeded = Math.round(30 * 3.5); // ~105 transactions
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
    for (const day of septemberDays) {
      const targetDayAmount = (TARGET_AMOUNT / 30) * day.multiplier;
      const transactionsForDay = Math.max(2, Math.round(3.5 * day.multiplier)); // 2-5 transactions per day

      let dayTotal = 0;

      for (let i = 0; i < transactionsForDay; i++) {
        const remainingForDay = targetDayAmount - dayTotal;
        const remainingTransactions = transactionsForDay - i;
        let targetTransactionAmount = remainingForDay / remainingTransactions;

        // Add some randomness (±30%)
        targetTransactionAmount *= 0.7 + Math.random() * 0.6;
        targetTransactionAmount = Math.max(
          8,
          Math.min(75, targetTransactionAmount)
        ); // $8-$75 range

        // Generate items for this transaction
        const items = [];
        let transactionSubtotal = 0;
        const itemCount = Math.floor(Math.random() * 5) + 1; // 1-5 items

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
        const timestamp = new Date(2025, 8, day.date, hour, minute);

        // Payment methods (slightly more cash in September)
        const paymentMethods = ["cash", "cash", "card", "card", "card"]; // 60% card, 40% cash
        const paymentMethod =
          paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

        const transaction = {
          transactionId: transactionId++,
          legacy_id: null,
          timestamp: timestamp,
          items: items,
          subtotal: Math.round(transactionSubtotal * 100) / 100,
          taxableAmount: Math.round(transactionSubtotal * 100) / 100,
          nonTaxableAmount: 0,
          tax: Math.round(tax * 100) / 100,
          total: Math.round(total * 100) / 100,
          cashback: 0,
          paymentBreakdown: [
            {
              method: paymentMethod,
              amount: Math.round(total * 100) / 100,
            },
          ],
          change: 0,
          transactionType: paymentMethod,
          cashAmount:
            paymentMethod === "cash" ? Math.round(total * 100) / 100 : 0,
          cardAmount:
            paymentMethod === "card" ? Math.round(total * 100) / 100 : 0,
          creditAmount: 0,
          cashier: "Admin User",
          receiptNumber: `RCP${transactionId}`,
          createdAt: timestamp,
        };

        transactions.push(transaction);
        dayTotal += total;
        runningTotal += total;
      }
    }

    // Adjust final transactions if we're significantly off target
    if (Math.abs(runningTotal - TARGET_AMOUNT) > TARGET_AMOUNT * 0.1) {
      const adjustment = TARGET_AMOUNT - runningTotal;
      const adjustmentPerTransaction = adjustment / transactions.length;

      transactions.forEach((transaction) => {
        transaction.total += adjustmentPerTransaction;
        transaction.subtotal = transaction.total / 1.13;
        transaction.tax = transaction.total - transaction.subtotal;
        transaction.total = Math.round(transaction.total * 100) / 100;
        transaction.subtotal = Math.round(transaction.subtotal * 100) / 100;
        transaction.tax = Math.round(transaction.tax * 100) / 100;
        transaction.taxableAmount = transaction.subtotal;

        // Update payment breakdown amount
        transaction.paymentBreakdown[0].amount = transaction.total;

        // Update cash/card amounts based on transaction type
        if (transaction.transactionType === "cash") {
          transaction.cashAmount = transaction.total;
          transaction.cardAmount = 0;
        } else {
          transaction.cashAmount = 0;
          transaction.cardAmount = transaction.total;
        }
      });

      runningTotal = transactions.reduce((sum, t) => sum + t.total, 0);
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
      `✅ Successfully inserted ${insertResult.insertedCount} September 2025 grocery transactions`
    );

    // Verify the results
    const verification = await collection
      .find({
        transactionId: { $gte: BASE_TRANSACTION_ID, $lt: transactionId },
        timestamp: {
          $gte: new Date("2025-09-01T00:00:00.000Z"),
          $lt: new Date("2025-10-01T00:00:00.000Z"),
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
    console.error("Error generating September grocery sales:", error);
  } finally {
    await client.close();
  }
}

generateSeptemberGrocerySales();
