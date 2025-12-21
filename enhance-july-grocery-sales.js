require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("❌ MongoDB URI not found in environment variables");
  process.exit(1);
}

const client = new MongoClient(uri);

async function enhanceJulyGrocerySales() {
  console.log("🛒 Enhancing July 2025 grocery sales for realism...\n");

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("convenience_store"); // Use correct database name
    const collection = db.collection("transactions");

    // Get all July 2025 grocery transactions
    const groceryTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00Z"),
          $lt: new Date("2025-08-01T00:00:00Z"),
        },
        "items.category": "Grocery",
      })
      .toArray();

    console.log(
      `📊 Found ${groceryTransactions.length} July grocery transactions\n`
    );

    let enhancementCount = 0;
    const enhancementLog = [];

    // Enhancement patterns for convenience store grocery items
    const enhancementPatterns = {
      // Morning rush (coffee, energy drinks, breakfast items)
      morningRush: {
        hours: [6, 7, 8, 9],
        items: [
          "red bull 250ml",
          "red bull 355ml",
          "coffee",
          "croissant",
          "muffin",
          "energy bar",
        ],
        multiplier: 1.2,
      },

      // Lunch time (quick snacks, drinks)
      lunchTime: {
        hours: [11, 12, 13, 14],
        items: [
          "chips",
          "sandwich",
          "cold drink cans",
          "2l cold drinks",
          "water bottles",
        ],
        multiplier: 1.15,
      },

      // After school/work (snacks, stationary)
      afterSchool: {
        hours: [15, 16, 17, 18],
        items: [
          "chips",
          "candy",
          "playing cards",
          "pens",
          "pencils",
          "notebooks",
        ],
        multiplier: 1.1,
      },

      // Weekend family shopping
      weekendFamily: {
        days: [0, 6], // Sunday, Saturday
        items: [
          "toilet paper",
          "2l cold drinks",
          "chips family pack",
          "greeting cards",
          "chargers",
        ],
        multiplier: 1.25,
        addExtra: true,
      },
    };

    // Process each transaction for enhancements
    for (const transaction of groceryTransactions) {
      const transactionDate = new Date(transaction.timestamp);
      const hour = transactionDate.getHours();
      const day = transactionDate.getDay();
      let shouldEnhance = false;
      let enhanceReason = "";

      // Check for morning rush enhancement
      if (enhancementPatterns.morningRush.hours.includes(hour)) {
        const hasEnergyItem = transaction.items.some((item) =>
          enhancementPatterns.morningRush.items.some((rushItem) =>
            item.name.toLowerCase().includes(rushItem.toLowerCase())
          )
        );

        if (hasEnergyItem && Math.random() < 0.3) {
          // 30% chance
          shouldEnhance = true;
          enhanceReason = "Morning rush - energy drink customer";
        }
      }

      // Check for lunch time enhancement
      if (enhancementPatterns.lunchTime.hours.includes(hour)) {
        const hasLunchItem = transaction.items.some((item) =>
          enhancementPatterns.lunchTime.items.some((lunchItem) =>
            item.name.toLowerCase().includes(lunchItem.toLowerCase())
          )
        );

        if (hasLunchItem && Math.random() < 0.25) {
          // 25% chance
          shouldEnhance = true;
          enhanceReason = "Lunch time - quick snack purchase";
        }
      }

      // Check for weekend family shopping
      if (
        enhancementPatterns.weekendFamily.days.includes(day) &&
        Math.random() < 0.2
      ) {
        shouldEnhance = true;
        enhanceReason = "Weekend family shopping";
      }

      // Apply enhancement if triggered
      if (shouldEnhance) {
        // Add small convenience items (impulse purchases)
        const impulseItems = [
          { name: "Gum Pack", price: 1.99, taxable: true },
          { name: "Lottery Ticket", price: 5.0, taxable: false },
          { name: "Mints", price: 1.49, taxable: true },
          { name: "Travel Size Hand Sanitizer", price: 2.99, taxable: true },
        ];

        const impulseItem =
          impulseItems[Math.floor(Math.random() * impulseItems.length)];
        transaction.items.push({
          ...impulseItem,
          quantity: 1,
        });

        // Recalculate totals
        const subtotal = transaction.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        const taxableAmount = transaction.items
          .filter((item) => item.taxable)
          .reduce((sum, item) => sum + item.price * item.quantity, 0);
        const tax = Math.round(taxableAmount * 0.13 * 100) / 100;
        const total = subtotal + tax;

        // Fix payment breakdown to match new total
        const paymentTotal = transaction.paymentBreakdown.reduce(
          (sum, payment) => sum + payment.amount,
          0
        );
        if (Math.abs(paymentTotal - total) > 0.01) {
          // Adjust the largest payment method
          const largestPayment = transaction.paymentBreakdown.reduce(
            (max, payment) => (payment.amount > max.amount ? payment : max)
          );
          const adjustment = total - paymentTotal;
          largestPayment.amount =
            Math.round((largestPayment.amount + adjustment) * 100) / 100;
        }

        // Update transaction
        await collection.updateOne(
          { _id: transaction._id },
          {
            $set: {
              items: transaction.items,
              subtotal: Math.round(subtotal * 100) / 100,
              tax: tax,
              total: Math.round(total * 100) / 100,
              paymentBreakdown: transaction.paymentBreakdown,
            },
          }
        );

        enhancementCount++;
        enhancementLog.push({
          id: transaction.transactionId,
          date: transactionDate.toISOString().split("T")[0],
          time: transactionDate.toTimeString().split(" ")[0],
          reason: enhanceReason,
          addedItem: impulseItem.name,
          newTotal: Math.round(total * 100) / 100,
        });
      }
    }

    console.log(
      `🚀 Enhanced ${enhancementCount} transactions with realistic patterns\n`
    );

    // Show enhancement summary
    if (enhancementLog.length > 0) {
      console.log("📋 Enhancement Summary:");
      enhancementLog.slice(0, 10).forEach((log) => {
        console.log(
          `  ${log.id} - ${log.date} ${log.time} - ${log.reason} - Added: ${log.addedItem} - New Total: $${log.newTotal}`
        );
      });
      if (enhancementLog.length > 10) {
        console.log(
          `  ... and ${enhancementLog.length - 10} more enhancements`
        );
      }
      console.log("");
    }

    // Final verification
    const finalVerification = await collection
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date("2025-07-01T00:00:00Z"),
              $lt: new Date("2025-08-01T00:00:00Z"),
            },
            "items.category": "Grocery",
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$total" },
            totalTransactions: { $sum: 1 },
            avgTransaction: { $avg: "$total" },
            totalTax: { $sum: "$tax" },
          },
        },
      ])
      .toArray();

    if (finalVerification.length > 0) {
      const stats = finalVerification[0];
      console.log("📊 Enhanced July 2025 Grocery Sales Verification:");
      console.log(`Total Sales: $${stats.totalSales.toFixed(2)}`);
      console.log(`Total Transactions: ${stats.totalTransactions}`);
      console.log(`Average Transaction: $${stats.avgTransaction.toFixed(2)}`);
      console.log(`Total Tax: $${stats.totalTax.toFixed(2)}`);
      console.log(
        `Enhanced Transactions: ${enhancementCount} (${(
          (enhancementCount / stats.totalTransactions) *
          100
        ).toFixed(1)}%)\n`
      );
    }

    // Payment method verification
    const paymentVerification = await collection
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date("2025-07-01T00:00:00Z"),
              $lt: new Date("2025-08-01T00:00:00Z"),
            },
            "items.category": "Grocery",
          },
        },
        { $unwind: "$paymentBreakdown" },
        {
          $group: {
            _id: "$paymentBreakdown.method",
            count: { $sum: 1 },
            total: { $sum: "$paymentBreakdown.amount" },
          },
        },
      ])
      .toArray();

    console.log("💳 Payment method verification after enhancement:");
    paymentVerification.forEach((payment) => {
      console.log(
        `${payment._id}: ${
          payment.count
        } transactions - $${payment.total.toFixed(2)}`
      );
    });

    console.log("\n✅ July grocery sales enhancement completed successfully!");
  } catch (error) {
    console.error("❌ Enhancement error:", error);
  } finally {
    await client.close();
    console.log("🔌 Connection closed");
  }
}

enhanceJulyGrocerySales();
