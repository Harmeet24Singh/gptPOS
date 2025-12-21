const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function enhanceAugustGrocerySales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    const TARGET_AMOUNT = 6300;
    const BASE_TRANSACTION_ID = 80800;

    // Check current total
    const currentTransactions = await collection
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

    // Additional grocery items for more variety
    const groceryItems = [
      // Higher value items
      { name: "Premium Coffee 1kg", price: 15.99, category: "Grocery" },
      { name: "Olive Oil 500ml", price: 12.99, category: "Grocery" },
      { name: "Honey 500g", price: 9.99, category: "Grocery" },
      { name: "Protein Bars 12pk", price: 18.99, category: "Grocery" },
      { name: "Premium Tea Set", price: 22.99, category: "Grocery" },
      { name: "Organic Juice 1L", price: 6.99, category: "Grocery" },
      { name: "Nuts Premium Mix 500g", price: 14.99, category: "Grocery" },
      { name: "Dark Chocolate 200g", price: 7.99, category: "Grocery" },

      // Bulk items
      { name: "Paper Towels 6pk", price: 12.99, category: "Grocery" },
      { name: "Toilet Paper 12pk", price: 15.99, category: "Grocery" },
      { name: "Laundry Pods 32pk", price: 19.99, category: "Grocery" },
      { name: "Cleaning Supplies Kit", price: 24.99, category: "Grocery" },
      { name: "Vitamins 60ct", price: 16.99, category: "Grocery" },
      { name: "First Aid Kit", price: 18.99, category: "Grocery" },

      // Regular items
      { name: "Frozen Pizza 400g", price: 6.99, category: "Grocery" },
      { name: "Ice Cream 1L", price: 5.99, category: "Grocery" },
      { name: "Frozen Vegetables 500g", price: 4.99, category: "Grocery" },
      { name: "Deli Meat 200g", price: 7.99, category: "Grocery" },
      { name: "Fresh Fruit Pack", price: 8.99, category: "Grocery" },
      { name: "Sandwich Wraps 8pk", price: 4.99, category: "Grocery" },
    ];

    // Calculate how many additional transactions we need
    const averageNeeded = needed / Math.ceil(needed / 60); // Target ~$60 average
    const additionalTransactions = Math.ceil(needed / 60);

    console.log(
      `📋 Creating ${additionalTransactions} additional transactions at ~$60 average`
    );

    const newTransactions = [];
    let addedTotal = 0;

    for (let i = 0; i < additionalTransactions; i++) {
      const remainingAmount = needed - addedTotal;
      const remainingTransactions = additionalTransactions - i;
      let targetAmount = remainingAmount / remainingTransactions;

      // Add variance (±20%)
      targetAmount *= 0.8 + Math.random() * 0.4;
      targetAmount = Math.max(20, Math.min(120, targetAmount)); // $20-$120 range

      // Generate items to reach target amount
      const items = [];
      let transactionSubtotal = 0;
      const maxItems = Math.floor(Math.random() * 5) + 3; // 3-7 items

      while (
        transactionSubtotal < targetAmount * 0.9 &&
        items.length < maxItems
      ) {
        const item =
          groceryItems[Math.floor(Math.random() * groceryItems.length)];
        const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
        const itemTotal = item.price * quantity;

        // Don't add if it would overshoot too much
        if (transactionSubtotal + itemTotal <= targetAmount * 1.2) {
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

      // Random day in August
      const day = Math.floor(Math.random() * 31) + 1;
      const hour = Math.floor(Math.random() * 17) + 6; // 6 AM - 10 PM
      const minute = Math.floor(Math.random() * 60);
      const timestamp = new Date(2025, 7, day, hour, minute);

      // Payment method
      const paymentMethods = ["cash", "card", "card", "card"];
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
      } transactions`
    );

    // Insert new transactions
    if (newTransactions.length > 0) {
      await collection.insertMany(newTransactions);
      console.log(
        `✅ Inserted ${newTransactions.length} additional transactions`
      );
    }

    // Verify final results
    const finalTransactions = await collection
      .find({
        transactionId: { $gte: BASE_TRANSACTION_ID, $lt: nextId },
        timestamp: {
          $gte: new Date("2025-08-01T00:00:00.000Z"),
          $lt: new Date("2025-09-01T00:00:00.000Z"),
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
  } catch (error) {
    console.error("Error enhancing August grocery sales:", error);
  } finally {
    await client.close();
  }
}

enhanceAugustGrocerySales();
