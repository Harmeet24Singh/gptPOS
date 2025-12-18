const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function fixNovemberGrocery() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    console.log("=== STEP 1: FIX UNKNOWN CATEGORY ITEMS ===");

    // Get all November transactions with Unknown category that contain grocery items
    const novemberUnknown = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
        $or: [
          { "items.category": null },
          { "items.category": "Unknown" },
          { "items.category": { $exists: false } },
        ],
      })
      .toArray();

    console.log(
      `Found ${novemberUnknown.length} November transactions with unknown categories`
    );

    // Grocery item patterns to identify
    const groceryPatterns = [
      /coca cola|pepsi|sprite|coke/i,
      /chips|lays|doritos|cheetos/i,
      /bread|bagel|bakery/i,
      /milk|dairy|cheese/i,
      /banana|apple|fruit|produce/i,
      /coffee|tea|beverage/i,
      /candy|chocolate|kit kat|snickers|reese/i,
      /soup|campbell/i,
      /cereal|breakfast/i,
      /yogurt|ice cream/i,
      /energy|red bull|monster/i,
      /water|juice/i,
      /snack|crackers/i,
      /frozen|pizza/i,
    ];

    let fixedCount = 0;
    let groceryTotal = 0;

    for (const transaction of novemberUnknown) {
      if (transaction.items && transaction.items.length > 0) {
        let hasGrocery = false;

        // Check each item to see if it should be categorized as grocery
        const updatedItems = transaction.items.map((item) => {
          if (!item.category || item.category === "Unknown") {
            const itemName = item.name || "";

            // Check if item name matches grocery patterns
            const isGroceryItem = groceryPatterns.some((pattern) =>
              pattern.test(itemName)
            );

            if (isGroceryItem) {
              hasGrocery = true;
              return { ...item, category: "Grocery" };
            }
          }
          return item;
        });

        // Update the transaction if we found grocery items
        if (hasGrocery) {
          await collection.updateOne(
            { _id: transaction._id },
            { $set: { items: updatedItems } }
          );
          fixedCount++;
          groceryTotal += transaction.total;

          if (fixedCount <= 5) {
            console.log(
              `Fixed: ${transaction.items
                .map((item) => item.name)
                .join(", ")} -> Grocery`
            );
          }
        }
      }
    }

    console.log(
      `Fixed ${fixedCount} transactions, converted $${groceryTotal.toFixed(
        2
      )} to grocery category`
    );

    // Check current grocery total after fixes
    console.log("\n=== STEP 2: CHECK CURRENT GROCERY TOTAL ===");

    const currentNovemberGrocery = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
        "items.category": "Grocery",
      })
      .toArray();

    let currentGroceryTotal = 0;
    currentNovemberGrocery.forEach((t) => (currentGroceryTotal += t.total));

    console.log(
      `Current November grocery: ${
        currentNovemberGrocery.length
      } transactions, $${currentGroceryTotal.toFixed(2)}`
    );

    // Calculate how much more we need to reach $5000
    const targetAmount = 5000;
    const amountNeeded = targetAmount - currentGroceryTotal;

    console.log(
      `Target: $${targetAmount}, Current: $${currentGroceryTotal.toFixed(
        2
      )}, Need: $${amountNeeded.toFixed(2)}`
    );

    if (amountNeeded > 0) {
      console.log("\n=== STEP 3: GENERATE ADDITIONAL GROCERY TRANSACTIONS ===");

      // Generate additional grocery transactions for various November dates
      const groceryItems = [
        { name: "Milk 2L", price: 4.99, category: "Grocery" },
        { name: "Bread Whole Wheat", price: 3.49, category: "Grocery" },
        { name: "Eggs 12ct", price: 3.99, category: "Grocery" },
        { name: "Bananas per lb", price: 1.29, category: "Grocery" },
        { name: "Cheese Slices", price: 5.99, category: "Grocery" },
        { name: "Yogurt 4-pack", price: 4.49, category: "Grocery" },
        { name: "Orange Juice 1L", price: 3.99, category: "Grocery" },
        { name: "Apples 3lb bag", price: 4.99, category: "Grocery" },
        { name: "Ground Beef 1lb", price: 6.99, category: "Grocery" },
        { name: "Chicken Breast 1lb", price: 8.99, category: "Grocery" },
        { name: "Rice 2kg", price: 7.99, category: "Grocery" },
        { name: "Pasta 1kg", price: 2.99, category: "Grocery" },
        { name: "Tomatoes per lb", price: 2.99, category: "Grocery" },
        { name: "Onions 3lb bag", price: 2.49, category: "Grocery" },
        { name: "Potatoes 5lb bag", price: 3.99, category: "Grocery" },
        { name: "Carrots 2lb bag", price: 2.49, category: "Grocery" },
        { name: "Lettuce Head", price: 2.99, category: "Grocery" },
        { name: "Cucumber each", price: 1.49, category: "Grocery" },
        { name: "Bell Peppers 3-pack", price: 3.99, category: "Grocery" },
        { name: "Frozen Pizza", price: 5.99, category: "Grocery" },
        { name: "Ice Cream 1L", price: 6.99, category: "Grocery" },
        { name: "Butter 454g", price: 5.49, category: "Grocery" },
        { name: "Cereal Family Size", price: 6.99, category: "Grocery" },
        { name: "Campbell's Soup", price: 1.99, category: "Grocery" },
        { name: "Peanut Butter 1kg", price: 7.99, category: "Grocery" },
        { name: "Jam 500ml", price: 4.99, category: "Grocery" },
        { name: "Crackers Box", price: 3.99, category: "Grocery" },
        { name: "Cookies Package", price: 4.49, category: "Grocery" },
        { name: "Frozen Vegetables", price: 3.99, category: "Grocery" },
        { name: "Canned Beans", price: 1.99, category: "Grocery" },
      ];

      // November dates to distribute transactions across
      const novemberDates = [];
      for (let day = 1; day <= 30; day++) {
        novemberDates.push(day);
      }

      // Day of week multipliers (like October)
      const dayMultipliers = {
        0: 0.4, // Sunday - lowest
        1: 0.8, // Monday
        2: 0.9, // Tuesday
        3: 0.95, // Wednesday
        4: 1.0, // Thursday
        5: 1.5, // Friday - higher
        6: 1.6, // Saturday - highest
      };

      let generatedAmount = 0;
      let generatedCount = 0;
      const targetTransactions = Math.ceil(amountNeeded / 8); // Average $8 per transaction

      for (
        let i = 0;
        i < targetTransactions && generatedAmount < amountNeeded;
        i++
      ) {
        // Random November date
        const day =
          novemberDates[Math.floor(Math.random() * novemberDates.length)];
        const date = new Date(2025, 10, day); // November is month 10
        const dayOfWeek = date.getDay();

        // Apply day multiplier to determine if we should generate this transaction
        if (Math.random() > dayMultipliers[dayOfWeek]) continue;

        // Random hour between 7 AM and 10 PM
        const hour = Math.floor(Math.random() * 15) + 7;
        const minute = Math.floor(Math.random() * 60);
        const second = Math.floor(Math.random() * 60);

        const timestamp = new Date(2025, 10, day, hour, minute, second);

        // Generate 1-3 items per transaction
        const itemCount = Math.floor(Math.random() * 3) + 1;
        const items = [];
        let transactionTotal = 0;

        for (let j = 0; j < itemCount; j++) {
          const item =
            groceryItems[Math.floor(Math.random() * groceryItems.length)];
          const quantity = Math.floor(Math.random() * 3) + 1;
          const itemTotal = item.price * quantity;

          items.push({
            id: Math.floor(Math.random() * 900000) + 100000,
            name: item.name,
            price: item.price,
            quantity: quantity,
            total: itemTotal,
            category: item.category,
            taxable: true,
          });

          transactionTotal += itemTotal;
        }

        // Payment breakdown (70% cash, 30% card like October)
        const paymentBreakdown = [];
        if (Math.random() < 0.7) {
          // Cash payment
          paymentBreakdown.push({ method: "cash", amount: transactionTotal });
        } else {
          // Card payment
          paymentBreakdown.push({ method: "card", amount: transactionTotal });
        }

        const transaction = {
          transactionId: Math.floor(Math.random() * 100000) + 300000, // 300000-399999 range for November
          timestamp: timestamp,
          items: items,
          total: transactionTotal,
          paymentBreakdown: paymentBreakdown,
          cashAmount:
            paymentBreakdown.find((p) => p.method === "cash")?.amount || 0,
          cardAmount:
            paymentBreakdown.find((p) => p.method === "card")?.amount || 0,
          tax: transactionTotal * 0.13,
          subtotal: transactionTotal / 1.13,
          change: 0,
          username: "system_generated",
        };

        await collection.insertOne(transaction);
        generatedAmount += transactionTotal;
        generatedCount++;

        if (generatedCount % 50 === 0) {
          console.log(
            `Generated ${generatedCount} transactions, $${generatedAmount.toFixed(
              2
            )} so far...`
          );
        }

        // Stop if we've reached our target
        if (generatedAmount >= amountNeeded) break;
      }

      console.log(
        `Generated ${generatedCount} additional grocery transactions totaling $${generatedAmount.toFixed(
          2
        )}`
      );
    }

    // Final verification
    console.log("\n=== FINAL VERIFICATION ===");

    const finalNovemberGrocery = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
        "items.category": "Grocery",
      })
      .toArray();

    let finalGroceryTotal = 0;
    finalNovemberGrocery.forEach((t) => (finalGroceryTotal += t.total));

    console.log(
      `Final November grocery: ${
        finalNovemberGrocery.length
      } transactions, $${finalGroceryTotal.toFixed(2)}`
    );

    // Payment method breakdown
    let cashCount = 0,
      cardCount = 0,
      cashTotal = 0,
      cardTotal = 0;

    finalNovemberGrocery.forEach((t) => {
      if (t.paymentBreakdown && t.paymentBreakdown.length > 0) {
        t.paymentBreakdown.forEach((payment) => {
          if (payment.method === "cash") {
            cashCount++;
            cashTotal += payment.amount;
          } else if (payment.method === "card") {
            cardCount++;
            cardTotal += payment.amount;
          }
        });
      }
    });

    console.log(
      `Payment breakdown: ${cashCount} cash transactions ($${cashTotal.toFixed(
        2
      )}), ${cardCount} card transactions ($${cardTotal.toFixed(2)})`
    );
    console.log(
      `Cash percentage: ${((cashTotal / finalGroceryTotal) * 100).toFixed(1)}%`
    );
  } catch (error) {
    console.error("Error fixing November grocery:", error);
  } finally {
    await client.close();
    console.log("\nConnection closed");
  }
}

// Run the fix
fixNovemberGrocery();
