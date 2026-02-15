const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function generateDecemberAlcoholSales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Configuration for December 2025
    const TARGET_AMOUNT = 8500;
    const MONTH_START = new Date("2025-12-01T00:00:00.000Z");
    const MONTH_END = new Date("2026-01-01T00:00:00.000Z");

    console.log(
      `\n🎯 Target: $${TARGET_AMOUNT} for December 2025 alcohol sales`,
    );

    // Check existing December alcohol sales
    const existingDecember = await collection
      .find({
        timestamp: { $gte: MONTH_START, $lt: MONTH_END },
        "items.category": "Alcohol",
      })
      .toArray();

    if (existingDecember.length > 0) {
      console.log(
        `⚠️  Found ${existingDecember.length} existing December alcohol transactions. Removing alcohol items only...`,
      );

      // Remove only alcohol items from existing transactions, don't delete entire transactions
      for (let transaction of existingDecember) {
        const nonAlcoholItems = transaction.items.filter(
          (item) => item.category !== "Alcohol",
        );
        if (nonAlcoholItems.length > 0) {
          // Update transaction with only non-alcohol items and recalculate totals
          const newSubtotal = nonAlcoholItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          );
          const newTax = newSubtotal * 0.13;
          const newTotal = newSubtotal + newTax;

          await collection.updateOne(
            { _id: transaction._id },
            {
              $set: {
                items: nonAlcoholItems,
                subtotal: newSubtotal,
                tax: newTax,
                total: newTotal,
              },
            },
          );
        } else {
          // If transaction only had alcohol items, delete it entirely
          await collection.deleteOne({ _id: transaction._id });
        }
      }
      console.log(`✅ Cleaned existing December alcohol data`);
    }

    // Realistic alcohol inventory that you actually carry
    const alcoholProducts = [
      // Beer 6-packs
      {
        name: "Budweiser 6-pack",
        price: 12.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "Corona 6-pack",
        price: 15.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "Heineken 6-pack",
        price: 16.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "Miller Lite 6-pack",
        price: 13.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "Labatt Blue 6-pack",
        price: 14.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "Stella Artois 6-pack",
        price: 17.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "Sapporo 6-pack",
        price: 16.99,
        category: "Alcohol",
        taxable: true,
      },

      // Beer 12-packs
      {
        name: "Coors Light 12-pack",
        price: 24.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "Molson Canadian 12-pack",
        price: 26.99,
        category: "Alcohol",
        taxable: true,
      },

      // Other alcoholic beverages
      {
        name: "Smirnoff Ice 6-pack",
        price: 18.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "White Claw 12-pack",
        price: 28.99,
        category: "Alcohol",
        taxable: true,
      },

      // Wine bottles
      {
        name: "Red Wine Bottle",
        price: 19.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "White Wine Bottle",
        price: 17.99,
        category: "Alcohol",
        taxable: true,
      },
      {
        name: "Rosé Wine Bottle",
        price: 21.99,
        category: "Alcohol",
        taxable: true,
      },
    ];

    // Calculate transactions needed
    const avgTransactionAmount = 25; // More realistic for convenience store alcohol
    const NUM_TRANSACTIONS = Math.round(TARGET_AMOUNT / avgTransactionAmount);

    console.log(
      `📊 Generating ${NUM_TRANSACTIONS} alcohol transactions with avg $${avgTransactionAmount.toFixed(2)} each`,
    );

    const transactions = [];
    let runningTotal = 0;

    // Generate realistic distribution throughout December
    const decemberDays = 31;
    const transactionsPerDay = NUM_TRANSACTIONS / decemberDays;

    for (let day = 1; day <= decemberDays; day++) {
      const isWeekend = new Date(2025, 11, day).getDay() % 6 === 0; // Sat or Sun
      const isHoliday = day >= 23 && day <= 26; // Christmas period
      const isNewYear = day === 31; // New Year's Eve

      let dailyTransactionCount = Math.round(transactionsPerDay);

      // Increase sales on weekends and holidays
      if (isWeekend)
        dailyTransactionCount = Math.round(dailyTransactionCount * 1.4);
      if (isHoliday)
        dailyTransactionCount = Math.round(dailyTransactionCount * 1.8);
      if (isNewYear)
        dailyTransactionCount = Math.round(dailyTransactionCount * 2.2);

      for (
        let i = 0;
        i < dailyTransactionCount && runningTotal < TARGET_AMOUNT;
        i++
      ) {
        const hour =
          isHoliday || isNewYear
            ? 10 + Math.floor(Math.random() * 12) // Extended hours during holidays
            : 9 + Math.floor(Math.random() * 13); // Regular hours

        const minute = Math.floor(Math.random() * 60);
        const timestamp = new Date(2025, 11, day, hour, minute, 0, 0);

        // Determine transaction size based on day type (convenience store realistic)
        let transactionType;
        const rand = Math.random();

        if (isHoliday || isNewYear) {
          // Holiday transactions - slightly more multi-item purchases
          if (rand < 0.15)
            transactionType = "large"; // 15% large (wine + beer)
          else if (rand < 0.4)
            transactionType = "medium"; // 25% medium (12-pack)
          else transactionType = "small"; // 60% small (6-pack)
        } else if (isWeekend) {
          // Weekend transactions
          if (rand < 0.1)
            transactionType = "large"; // 10% large
          else if (rand < 0.35)
            transactionType = "medium"; // 25% medium
          else transactionType = "small"; // 65% small
        } else {
          // Weekday transactions
          if (rand < 0.05)
            transactionType = "large"; // 5% large
          else if (rand < 0.25)
            transactionType = "medium"; // 20% medium
          else transactionType = "small"; // 75% small
        }

        const items = [];
        let transactionTotal = 0;

        if (transactionType === "large") {
          // Large transactions ($35-60) - wine + beer, or multiple items
          const numItems = 2 + Math.floor(Math.random() * 2); // 2-3 items

          for (let j = 0; j < numItems; j++) {
            const product =
              alcoholProducts[
                Math.floor(Math.random() * alcoholProducts.length)
              ];
            const quantity = 1; // Usually 1 of each

            items.push({
              id: `alcohol_${Date.now()}_${j}`,
              name: product.name,
              price: product.price,
              quantity: quantity,
              category: product.category,
              taxable: product.taxable,
              total: product.price * quantity,
            });

            transactionTotal += product.price * quantity;
          }
        } else if (transactionType === "medium") {
          // Medium transactions ($20-35) - 12-packs, wine, or premium 6-packs
          const mediumProducts = alcoholProducts.filter(
            (p) =>
              p.name.includes("12-pack") ||
              p.name.includes("Wine") ||
              p.name.includes("White Claw"),
          );
          const product =
            mediumProducts[Math.floor(Math.random() * mediumProducts.length)];
          const quantity = 1;

          items.push({
            id: `alcohol_${Date.now()}_0`,
            name: product.name,
            price: product.price,
            quantity: quantity,
            category: product.category,
            taxable: product.taxable,
            total: product.price * quantity,
          });

          transactionTotal += product.price * quantity;
        } else {
          // Small transactions ($12-20) - single 6-packs
          const smallProducts = alcoholProducts.filter((p) =>
            p.name.includes("6-pack"),
          );
          const product =
            smallProducts[Math.floor(Math.random() * smallProducts.length)];
          const quantity = 1;

          items.push({
            id: `alcohol_${Date.now()}_0`,
            name: product.name,
            price: product.price,
            quantity: quantity,
            category: product.category,
            taxable: product.taxable,
            total: product.price * quantity,
          });

          transactionTotal += product.price * quantity;
        }

        // Calculate tax and totals
        const subtotal = transactionTotal;
        const tax = subtotal * 0.13; // 13% HST
        const total = subtotal + tax;

        // Payment method distribution (realistic for convenience store)
        let paymentMethod,
          cashAmount = 0,
          cardAmount = 0;
        if (total > 35) {
          paymentMethod = "card"; // Larger purchases mostly card
          cardAmount = total;
        } else if (Math.random() < 0.65) {
          paymentMethod = "card"; // 65% card
          cardAmount = total;
        } else {
          paymentMethod = "cash";
          cashAmount = total;
        }

        const transaction = {
          id: `dec_alcohol_${Date.now()}_${i}`,
          timestamp: timestamp.toISOString(),
          items: items,
          subtotal: subtotal,
          tax: tax,
          total: total,
          paymentMethod: paymentMethod,
          transactionType: paymentMethod,
          cashAmount: cashAmount,
          cardAmount: cardAmount,
          creditAmount: 0,
          paymentBreakdown: [
            {
              method: paymentMethod,
              amount: total,
            },
          ],
          cashier: "December-Sales",
        };

        transactions.push(transaction);
        runningTotal += total;

        // Stop if we've reached our target
        if (runningTotal >= TARGET_AMOUNT) break;
      }

      if (runningTotal >= TARGET_AMOUNT) break;
    }

    // Insert transactions
    console.log(`\n💾 Inserting ${transactions.length} transactions...`);
    const result = await collection.insertMany(transactions);
    console.log(`✅ Inserted ${result.insertedCount} transactions`);

    // Calculate and display final totals
    const finalTotal = transactions.reduce((sum, t) => sum + t.total, 0);
    console.log(`\n🎉 Final Results:`);
    console.log(`💰 Total Alcohol Sales: $${finalTotal.toFixed(2)}`);
    console.log(`🎯 Target: $${TARGET_AMOUNT.toFixed(2)}`);
    console.log(
      `📊 Achievement: ${((finalTotal / TARGET_AMOUNT) * 100).toFixed(1)}%`,
    );
    console.log(`🏪 Transactions Created: ${transactions.length}`);
    console.log(
      `💳 Avg Transaction: $${(finalTotal / transactions.length).toFixed(2)}`,
    );
  } catch (error) {
    console.error("❌ Error generating December alcohol sales:", error);
  } finally {
    await client.close();
    console.log("🔒 Database connection closed");
  }
}

generateDecemberAlcoholSales();
