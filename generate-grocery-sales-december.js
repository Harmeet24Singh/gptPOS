const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function generateDecemberGrocerySales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Configuration for December 2025
    const TARGET_AMOUNT = 4200;
    const MONTH_START = new Date("2025-12-01T00:00:00.000Z");
    const MONTH_END = new Date("2026-01-01T00:00:00.000Z");

    console.log(
      `\n🎯 Target: $${TARGET_AMOUNT} for December 2025 grocery sales`,
    );

    // Check existing December grocery sales
    const existingDecember = await collection
      .find({
        timestamp: {
          $gte: MONTH_START.toISOString(),
          $lt: MONTH_END.toISOString(),
        },
        "items.category": "Grocery",
      })
      .toArray();

    if (existingDecember.length > 0) {
      console.log(
        `⚠️  Found ${existingDecember.length} existing December grocery transactions. Removing grocery items only...`,
      );

      // Remove only grocery items from existing transactions, don't delete entire transactions
      for (let transaction of existingDecember) {
        const nonGroceryItems = transaction.items.filter(
          (item) => item.category !== "Grocery",
        );
        if (nonGroceryItems.length > 0) {
          // Update transaction with only non-grocery items and recalculate totals
          const newSubtotal = nonGroceryItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          );
          const newTax = newSubtotal * 0.13;
          const newTotal = newSubtotal + newTax;

          await collection.updateOne(
            { _id: transaction._id },
            {
              $set: {
                items: nonGroceryItems,
                subtotal: Math.round(newSubtotal * 100) / 100,
                tax: Math.round(newTax * 100) / 100,
                total: Math.round(newTotal * 100) / 100,
              },
            },
          );
        } else {
          // Delete transaction if it only had grocery items
          await collection.deleteOne({ _id: transaction._id });
        }
      }
      console.log(`✅ Cleaned up existing December grocery data`);
    }

    // December grocery items with seasonal focus (Christmas/holiday items)
    const groceryItems = [
      // Christmas/Holiday beverages
      { name: "Hot Chocolate Premium 300g", price: 6.99, category: "Grocery" },
      { name: "Eggnog Traditional 1L", price: 4.99, category: "Grocery" },
      { name: "Mulled Cider Mix", price: 4.49, category: "Grocery" },
      { name: "Holiday Coffee Blend", price: 10.99, category: "Grocery" },
      { name: "Peppermint Tea 24ct", price: 6.99, category: "Grocery" },
      { name: "Cranberry Juice 1L", price: 3.99, category: "Grocery" },
      { name: "Apple Cider Sparkling 750ml", price: 5.99, category: "Grocery" },

      // Christmas/Holiday seasonal items
      { name: "Christmas Ham Glaze", price: 4.99, category: "Grocery" },
      { name: "Turkey Stuffing Mix", price: 3.49, category: "Grocery" },
      { name: "Cranberry Sauce 400ml", price: 3.99, category: "Grocery" },
      { name: "Christmas Pudding 450g", price: 8.99, category: "Grocery" },
      { name: "Mincemeat Tart Filling", price: 4.49, category: "Grocery" },
      { name: "Holiday Spice Mix", price: 5.99, category: "Grocery" },
      { name: "Christmas Cookie Mix", price: 4.99, category: "Grocery" },
      { name: "Chocolate Yule Log Kit", price: 9.99, category: "Grocery" },
      { name: "Gingerbread House Kit", price: 12.99, category: "Grocery" },
      { name: "Holiday Cake Mix", price: 5.49, category: "Grocery" },

      // Holiday snacks & treats
      { name: "Christmas Cookies Tin", price: 8.99, category: "Grocery" },
      { name: "Holiday Chocolate Box", price: 12.99, category: "Grocery" },
      { name: "Candy Canes 24pk", price: 3.99, category: "Grocery" },
      { name: "Christmas Nuts Mix 300g", price: 8.99, category: "Grocery" },
      { name: "Holiday Popcorn Tin", price: 7.99, category: "Grocery" },
      { name: "Peppermint Bark 200g", price: 6.99, category: "Grocery" },
      { name: "Christmas Fudge Box", price: 9.99, category: "Grocery" },

      // Basic groceries (winter/holiday cooking)
      { name: "Bread Whole Wheat", price: 3.49, category: "Grocery" },
      { name: "Milk 3.25% 1L", price: 3.89, category: "Grocery" },
      { name: "Eggs Large 12pk", price: 5.99, category: "Grocery" },
      { name: "Butter Unsalted 454g", price: 7.49, category: "Grocery" },
      { name: "Heavy Cream 250ml", price: 3.99, category: "Grocery" },
      { name: "Cheese Aged Cheddar 300g", price: 7.99, category: "Grocery" },
      { name: "Yogurt Greek Vanilla 750g", price: 5.49, category: "Grocery" },
      { name: "Cereal Holiday Edition", price: 5.99, category: "Grocery" },
      { name: "Flour All-Purpose 2kg", price: 4.99, category: "Grocery" },
      { name: "Sugar Brown 1kg", price: 3.99, category: "Grocery" },
      { name: "Vanilla Extract 100ml", price: 6.99, category: "Grocery" },

      // Winter comfort foods
      { name: "Soup Hearty Chicken 540ml", price: 2.99, category: "Grocery" },
      { name: "Pasta Festive Shapes 500g", price: 3.99, category: "Grocery" },
      { name: "Rice Wild Mix 500g", price: 5.49, category: "Grocery" },
      { name: "Potatoes Roasting 3lb", price: 4.99, category: "Grocery" },
      { name: "Onions Yellow 2lb", price: 2.99, category: "Grocery" },
      { name: "Carrots Baby 1lb", price: 3.49, category: "Grocery" },

      // Holiday household items
      { name: "Paper Towels Holiday 6pk", price: 9.99, category: "Grocery" },
      { name: "Toilet Paper Soft 16pk", price: 13.99, category: "Grocery" },
      { name: "Dish Soap Cinnamon Scent", price: 4.99, category: "Grocery" },
      { name: "Laundry Detergent Fresh 2L", price: 11.99, category: "Grocery" },
      { name: "Air Freshener Pine 300ml", price: 4.49, category: "Grocery" },
      { name: "Candles Holiday Scented", price: 8.99, category: "Grocery" },

      // Personal care (winter/dry skin)
      { name: "Hand Lotion Winter Care", price: 5.99, category: "Grocery" },
      { name: "Lip Balm Peppermint", price: 3.49, category: "Grocery" },
      { name: "Vitamins D 90ct", price: 14.99, category: "Grocery" },
      { name: "Cold Medicine 24ct", price: 8.99, category: "Grocery" },
    ];

    // Generate all December days with Christmas patterns
    const decemberDays = [];
    for (let day = 1; day <= 31; day++) {
      const date = new Date(2025, 11, day); // Month 11 = December (0-indexed)
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // December patterns: Christmas shopping period, New Year preparation
      let multiplier = 1.0;
      if (day >= 20 && day <= 24) {
        multiplier = 1.8; // Christmas week - peak shopping
      } else if (day >= 15 && day <= 19) {
        multiplier = 1.4; // Pre-Christmas heavy shopping
      } else if (day >= 29 && day <= 31) {
        multiplier = 1.3; // New Year prep
      } else if (day >= 1 && day <= 10) {
        multiplier = 1.1; // Early December mild increase
      } else if (dayOfWeek === 0 || dayOfWeek === 6) {
        multiplier = 1.2; // Weekend shopping boost
      } else {
        multiplier = 0.95; // Regular weekdays
      }

      decemberDays.push({
        date: day,
        dayOfWeek: dayOfWeek,
        multiplier: multiplier,
        fullDate: date,
      });
    }

    console.log(`\n📅 December 2025 grocery distribution preview:`);
    const averagePerDay = TARGET_AMOUNT / 31;
    decemberDays.slice(0, 7).forEach((day) => {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const expectedAmount = averagePerDay * day.multiplier;
      console.log(
        `  ${dayNames[day.dayOfWeek]} Dec ${day.date}: ~$${expectedAmount.toFixed(2)} (${day.multiplier}x)`,
      );
    });

    // Calculate transactions needed (similar to November pattern)
    const totalTransactionsNeeded = Math.round(31 * 3.5); // ~108 transactions (slightly higher for December)
    const averageTransactionValue = TARGET_AMOUNT / totalTransactionsNeeded;

    console.log(
      `\n📊 Planning ${totalTransactionsNeeded} transactions at ~$${averageTransactionValue.toFixed(2)} average`,
    );

    let runningTotal = 0;
    const transactions = [];

    // Generate transactions for each day
    for (const day of decemberDays) {
      const targetDayAmount = (TARGET_AMOUNT / 31) * day.multiplier;
      const transactionsForDay = Math.max(2, Math.round(3.5 * day.multiplier)); // 2-6 transactions per day

      let dayTotal = 0;

      for (let i = 0; i < transactionsForDay; i++) {
        const remainingForDay = targetDayAmount - dayTotal;
        const remainingTransactions = transactionsForDay - i;
        let targetTransactionAmount = remainingForDay / remainingTransactions;

        // Add some randomness (±25%, same as November)
        targetTransactionAmount *= 0.75 + Math.random() * 0.5;
        targetTransactionAmount = Math.max(
          10,
          Math.min(65, targetTransactionAmount),
        ); // $10-$65 range (same as November)

        // Generate items for this transaction
        const items = [];
        let transactionSubtotal = 0;
        const itemCount = Math.floor(Math.random() * 4) + 1; // 1-4 items (same as November)

        for (let j = 0; j < itemCount; j++) {
          const item =
            groceryItems[Math.floor(Math.random() * groceryItems.length)];
          const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity (same as November)
          const itemTotal = item.price * quantity;

          items.push({
            id: `grocery_${Date.now()}_${j}`,
            name: item.name,
            price: item.price,
            quantity: quantity,
            category: item.category,
            taxable: true,
            total: itemTotal,
          });

          transactionSubtotal += itemTotal;
        }

        // Calculate tax (13% HST, same as November)
        const tax = transactionSubtotal * 0.13;
        const total = transactionSubtotal + tax;

        // Random time during business hours (7 AM - 9 PM, same as November)
        const hour = Math.floor(Math.random() * 14) + 7; // 7-20 (7 AM - 8 PM)
        const minute = Math.floor(Math.random() * 60);
        const timestamp = new Date(
          2025,
          11,
          day.date,
          hour,
          minute,
        ).toISOString();

        // Payment methods (same 50/50 split as November)
        const paymentMethods = ["cash", "cash", "card", "card"]; // 50/50 split
        const paymentMethod =
          paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

        const transaction = {
          timestamp: timestamp,
          items: items,
          subtotal: Math.round(transactionSubtotal * 100) / 100,
          tax: Math.round(tax * 100) / 100,
          total: Math.round(total * 100) / 100,
          paymentMethod: paymentMethod,
          transactionType: paymentMethod,
          cashAmount:
            paymentMethod === "cash" ? Math.round(total * 100) / 100 : 0,
          cardAmount:
            paymentMethod === "card" ? Math.round(total * 100) / 100 : 0,
          creditAmount: 0,
          paymentBreakdown: [
            {
              method: paymentMethod,
              amount: Math.round(total * 100) / 100,
            },
          ],
          cashier: "December-Sales",
        };

        transactions.push(transaction);
        dayTotal += total;
        runningTotal += total;
      }
    }

    console.log(
      `\n📈 Generated ${transactions.length} grocery transactions totaling $${runningTotal.toFixed(2)}`,
    );
    console.log(
      `🎯 Target was $${TARGET_AMOUNT}, variance: ${(((runningTotal - TARGET_AMOUNT) / TARGET_AMOUNT) * 100).toFixed(1)}%`,
    );

    // Insert all transactions
    if (transactions.length > 0) {
      const insertResult = await collection.insertMany(transactions);
      console.log(
        `✅ Successfully inserted ${insertResult.insertedCount} December 2025 grocery transactions`,
      );

      // Verification summary
      console.log(`\n📋 Summary:`);
      console.log(`   💰 Total grocery sales: $${runningTotal.toFixed(2)}`);
      console.log(`   📦 Total transactions: ${transactions.length}`);
      console.log(`   💳 Payment breakdown:`);

      const cashTransactions = transactions.filter(
        (t) => t.paymentMethod === "cash",
      ).length;
      const cardTransactions = transactions.filter(
        (t) => t.paymentMethod === "card",
      ).length;
      const cashTotal = transactions
        .filter((t) => t.paymentMethod === "cash")
        .reduce((sum, t) => sum + t.total, 0);
      const cardTotal = transactions
        .filter((t) => t.paymentMethod === "card")
        .reduce((sum, t) => sum + t.total, 0);

      console.log(
        `       Cash: ${cashTransactions} transactions ($${cashTotal.toFixed(2)})`,
      );
      console.log(
        `       Card: ${cardTransactions} transactions ($${cardTotal.toFixed(2)})`,
      );
      console.log(`   📅 Date range: December 1-31, 2025`);
      console.log(`   👤 Cashier: December-Sales`);
    }
  } catch (error) {
    console.error("❌ Error generating December grocery sales:", error);
  } finally {
    await client.close();
    console.log("🔒 Database connection closed");
  }
}

// Run the script
generateDecemberGrocerySales();
