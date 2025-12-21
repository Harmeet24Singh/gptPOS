const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function enhanceNovemberGrocerySales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    const TARGET_AMOUNT = 3100;
    const BASE_TRANSACTION_ID = 110800;

    // Check current total
    const currentTransactions = await collection
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

    const currentTotal = currentTransactions.reduce(
      (sum, t) => sum + t.total,
      0
    );
    const needed = TARGET_AMOUNT - currentTotal;

    console.log(`\n📊 Current total: $${currentTotal.toFixed(2)}`);
    console.log(`🎯 Target: $${TARGET_AMOUNT}`);
    console.log(`➕ Need to add: $${needed.toFixed(2)}`);

    if (needed <= 0) {
      console.log("✅ Target already reached!");
      return;
    }

    // Get the highest transaction ID to continue from
    let nextId =
      Math.max(...currentTransactions.map((t) => t.transactionId)) + 1;

    // Premium November grocery items for enhancement
    const premiumItems = [
      // Premium Thanksgiving items
      { name: "Organic Turkey 5kg", price: 45.99, category: "Grocery" },
      { name: "Premium Ham 2kg", price: 28.99, category: "Grocery" },
      { name: "Gourmet Stuffing Mix", price: 8.99, category: "Grocery" },
      { name: "Artisan Cranberry Sauce", price: 6.99, category: "Grocery" },
      { name: "Premium Wine Sauce", price: 12.99, category: "Grocery" },
      { name: "Holiday Spice Collection", price: 15.99, category: "Grocery" },

      // Premium grocery bundles
      { name: "Family Meal Kit", price: 32.99, category: "Grocery" },
      { name: "Gourmet Coffee Set", price: 24.99, category: "Grocery" },
      { name: "Premium Tea Collection", price: 19.99, category: "Grocery" },
      { name: "Winter Comfort Bundle", price: 22.99, category: "Grocery" },
      { name: "Holiday Baking Kit", price: 18.99, category: "Grocery" },
      { name: "Soup & Bread Combo", price: 14.99, category: "Grocery" },

      // Regular enhanced items
      { name: "Premium Olive Oil 750ml", price: 16.99, category: "Grocery" },
      { name: "Artisan Bread Selection", price: 9.99, category: "Grocery" },
      { name: "Gourmet Cheese Platter", price: 21.99, category: "Grocery" },
      { name: "Premium Nuts Gift Box", price: 17.99, category: "Grocery" },
      { name: "Winter Fruit Basket", price: 13.99, category: "Grocery" },
      { name: "Holiday Cookie Tin", price: 11.99, category: "Grocery" },
    ];

    // Calculate how many additional transactions we need
    const additionalTransactions = Math.ceil(needed / 50); // Target ~$50 average

    console.log(
      `📋 Creating ${additionalTransactions} additional transactions for premium November items`
    );

    const newTransactions = [];
    let addedTotal = 0;

    for (let i = 0; i < additionalTransactions; i++) {
      const remainingAmount = needed - addedTotal;
      const remainingTransactions = additionalTransactions - i;
      let targetAmount = remainingAmount / remainingTransactions;

      // Add variance (±20%)
      targetAmount *= 0.8 + Math.random() * 0.4;
      targetAmount = Math.max(25, Math.min(100, targetAmount)); // $25-$100 range

      // Generate premium items to reach target amount
      const items = [];
      let transactionSubtotal = 0;
      const maxItems = Math.floor(Math.random() * 3) + 2; // 2-4 premium items

      while (
        transactionSubtotal < targetAmount * 0.9 &&
        items.length < maxItems
      ) {
        const item =
          premiumItems[Math.floor(Math.random() * premiumItems.length)];
        const quantity = 1; // Premium items typically bought in single quantities
        const itemTotal = item.price * quantity;

        // Don't add if it would overshoot too much
        if (transactionSubtotal + itemTotal <= targetAmount * 1.3) {
          items.push({
            name: item.name,
            price: item.price,
            quantity: quantity,
            category: item.category,
            total: itemTotal,
          });

          transactionSubtotal += itemTotal;
        }
      }

      // Calculate tax (13% HST)
      const tax = transactionSubtotal * 0.13;
      const total = transactionSubtotal + tax;

      // Focus on Thanksgiving period and weekends
      const weekendDays = [1, 2, 8, 9, 15, 16, 22, 23, 29, 30]; // Weekends
      const thanksgivingDays = [20, 21, 22, 23, 24, 25, 26, 27]; // Thanksgiving week
      const preferredDays = [...weekendDays, ...thanksgivingDays];
      const day =
        preferredDays[Math.floor(Math.random() * preferredDays.length)];

      const hour = Math.floor(Math.random() * 12) + 9; // 9 AM - 8 PM
      const minute = Math.floor(Math.random() * 60);
      const timestamp = new Date(2025, 10, day, hour, minute);

      // Payment method (premium purchases more likely card)
      const paymentMethods = ["card", "card", "card", "cash"]; // 75% card
      const paymentMethod =
        paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      const transaction = {
        transactionId: nextId++,
        items: items,
        subtotal: Math.round(transactionSubtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
        paymentMethod: paymentMethod,
        timestamp: timestamp,
        cashier: "Admin User",
        receiptNumber: `RCP${nextId - 1}`,
        createdAt: timestamp,
        transactionType: paymentMethod,
      };

      newTransactions.push(transaction);
      addedTotal += total;
    }

    console.log(
      `\n💰 Adding $${addedTotal.toFixed(2)} in ${
        newTransactions.length
      } premium transactions`
    );

    // Insert new transactions
    if (newTransactions.length > 0) {
      await collection.insertMany(newTransactions);
      console.log(
        `✅ Inserted ${newTransactions.length} additional premium transactions`
      );
    }

    // Verify final results
    const finalTransactions = await collection
      .find({
        transactionId: { $gte: BASE_TRANSACTION_ID, $lt: nextId },
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
      })
      .toArray();

    const finalTotal = finalTransactions.reduce((sum, t) => sum + t.total, 0);
    const groceryItemsCount = finalTransactions.reduce(
      (sum, t) =>
        sum +
        t.items
          .filter((item) => item.category === "Grocery")
          .reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    console.log(`\n📊 Final Verification:`);
    console.log(`   💰 Total Sales: $${finalTotal.toFixed(2)}`);
    console.log(
      `   🎯 Target: $${TARGET_AMOUNT} (${(
        ((finalTotal - TARGET_AMOUNT) / TARGET_AMOUNT) *
        100
      ).toFixed(1)}% variance)`
    );
    console.log(`   🛒 Transactions: ${finalTransactions.length}`);
    console.log(`   📦 Grocery Items Sold: ${groceryItemsCount}`);
    console.log(
      `   💳 Average Transaction: $${(
        finalTotal / finalTransactions.length
      ).toFixed(2)}`
    );

    // Payment breakdown
    const paymentBreakdown = finalTransactions.reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + 1;
      return acc;
    }, {});

    console.log(`\n💳 Payment Methods:`);
    Object.entries(paymentBreakdown).forEach(([method, count]) => {
      const percentage = ((count / finalTransactions.length) * 100).toFixed(1);
      console.log(`   ${method}: ${count} (${percentage}%)`);
    });

    // Thanksgiving week analysis
    const thanksgivingWeek = finalTransactions.filter((t) => {
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
    console.error("Error enhancing November grocery sales:", error);
  } finally {
    await client.close();
  }
}

enhanceNovemberGrocerySales();
