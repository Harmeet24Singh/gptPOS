const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function generateTobaccoSalesOctober() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const inventoryCollection = db.collection("inventory");
    const transactionCollection = db.collection("transactions");

    console.log(
      "\n🚬 Generating October 2025 tobacco sales targeting $8,342..."
    );

    // Get all tobacco items (ignoring stock levels)
    const tobaccoItems = await inventoryCollection
      .find({
        category: "Tobacco",
      })
      .toArray();

    console.log(
      `📦 Using all ${tobaccoItems.length} tobacco items regardless of stock`
    );

    // Get starting transaction ID for October
    const existingOctoberTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-10-01T00:00:00.000Z"),
          $lt: new Date("2025-11-01T00:00:00.000Z"),
        },
      })
      .sort({ transactionId: -1 })
      .limit(1)
      .toArray();

    let currentTransactionId = 101001; // Start from clean range for October tobacco
    if (existingOctoberTransactions.length > 0) {
      currentTransactionId = Math.max(
        currentTransactionId,
        existingOctoberTransactions[0].transactionId + 1
      );
    }

    console.log(`🆔 Starting transaction ID: ${currentTransactionId}`);

    // Target and tracking
    const targetAmount = 8342;
    let totalGenerated = 0;
    const transactions = [];

    // Payment method distribution (consistent with previous tobacco months)
    const paymentMethods = [
      { method: "cash", percentage: 64 },
      { method: "card", percentage: 36 },
    ];

    // Business hours: 7 AM to 9 PM
    const businessHours = { start: 7, end: 21 };

    // Generate transactions throughout October 2025
    const daysInOctober = 31;

    console.log(`📅 Generating tobacco transactions for October 1-31, 2025...`);

    while (totalGenerated < targetAmount) {
      // Random day in October
      const day = Math.floor(Math.random() * daysInOctober) + 1;
      const hour =
        Math.floor(Math.random() * (businessHours.end - businessHours.start)) +
        businessHours.start;
      const minute = Math.floor(Math.random() * 60);

      const timestamp = new Date(2025, 9, day, hour, minute); // Month is 0-indexed (9 = October)

      // Create realistic tobacco purchase (1-4 items)
      const itemCount =
        Math.random() < 0.7
          ? 1
          : Math.random() < 0.9
          ? 2
          : Math.random() < 0.97
          ? 3
          : 4;

      const transactionItems = [];
      let subtotal = 0;

      for (let i = 0; i < itemCount; i++) {
        const randomItem =
          tobaccoItems[Math.floor(Math.random() * tobaccoItems.length)];

        // Quantity logic: same as established pattern
        let quantity;
        if (randomItem.price <= 5) {
          // Small items (individual cigars, etc.) - can buy 2-5
          quantity =
            Math.random() < 0.5
              ? 1
              : Math.random() < 0.8
              ? 2
              : Math.random() < 0.95
              ? 3
              : Math.floor(Math.random() * 3) + 4;
        } else if (randomItem.price > 50) {
          // Cartons - almost always 1, rarely 2
          quantity = Math.random() < 0.95 ? 1 : 2;
        } else {
          // Regular packs - 1-3
          quantity = Math.random() < 0.7 ? 1 : Math.random() < 0.95 ? 2 : 3;
        }

        const itemTotal = randomItem.price * quantity;
        subtotal += itemTotal;

        transactionItems.push({
          name: randomItem.name,
          category: "Tobacco",
          price: randomItem.price,
          quantity: quantity,
          total: itemTotal,
          taxable: randomItem.taxable || false,
        });
      }

      // Since tobacco is non-taxable, no tax calculation needed
      const tax = 0;
      const total = subtotal;

      // Skip if this would exceed our target by too much
      if (totalGenerated + total > targetAmount + 200) {
        continue;
      }

      // Payment method selection
      const paymentRandom = Math.random() * 100;
      let selectedPayment = paymentMethods[0];
      let cumulative = 0;

      for (const payment of paymentMethods) {
        cumulative += payment.percentage;
        if (paymentRandom <= cumulative) {
          selectedPayment = payment;
          break;
        }
      }

      // Create transaction with mandatory paymentBreakdown array
      const transaction = {
        transactionId: currentTransactionId,
        timestamp: timestamp,
        items: transactionItems,
        subtotal: subtotal,
        tax: tax,
        total: total,
        taxableAmount: 0, // Tobacco is non-taxable
        nonTaxableAmount: subtotal,
        includeTax: false,
        paymentMethod: selectedPayment.method,
        paymentBreakdown: [
          {
            method: selectedPayment.method,
            amount: total,
          },
        ],
        cashAmount: selectedPayment.method === "cash" ? total : 0,
        cardAmount: selectedPayment.method === "card" ? total : 0,
        cashback: 0,
        finalTotal: total,
        receiptNumber: `RCP${currentTransactionId + 1}`,
        cashier: "Admin User",
        createdAt: timestamp,
        transactionType: selectedPayment.method,
      };

      transactions.push(transaction);
      totalGenerated += total;
      currentTransactionId++;

      // Progress logging every 30 transactions
      if (transactions.length % 30 === 0) {
        console.log(
          `   Generated ${
            transactions.length
          } transactions, total: $${totalGenerated.toFixed(2)}`
        );
      }

      // Safety break to avoid infinite loop
      if (transactions.length > 600) {
        console.log("⚠️  Reached 600 transactions, stopping generation");
        break;
      }
    }

    console.log(`\n📊 Generation Summary:`);
    console.log(`   Target: $${targetAmount.toFixed(2)}`);
    console.log(`   Generated: $${totalGenerated.toFixed(2)}`);
    console.log(
      `   Accuracy: ${((totalGenerated / targetAmount) * 100).toFixed(1)}%`
    );
    console.log(`   Total Transactions: ${transactions.length}`);

    // Payment method breakdown
    const paymentBreakdown = transactions.reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + 1;
      return acc;
    }, {});

    console.log(`\n💳 Payment Method Distribution:`);
    Object.entries(paymentBreakdown).forEach(([method, count]) => {
      const percentage = ((count / transactions.length) * 100).toFixed(1);
      console.log(`   ${method}: ${count} transactions (${percentage}%)`);
    });

    // Item analysis
    const itemFrequency = {};
    let totalItems = 0;
    transactions.forEach((t) => {
      t.items.forEach((item) => {
        itemFrequency[item.name] =
          (itemFrequency[item.name] || 0) + item.quantity;
        totalItems += item.quantity;
      });
    });

    console.log(`\n📦 Item Analysis:`);
    console.log(`   Total items sold: ${totalItems}`);
    console.log(
      `   Average items per transaction: ${(
        totalItems / transactions.length
      ).toFixed(1)}`
    );

    // Show top selling tobacco items
    const sortedItems = Object.entries(itemFrequency).sort(
      (a, b) => b[1] - a[1]
    );
    console.log(`\n🏆 Top 10 tobacco items sold:`);
    sortedItems.slice(0, 10).forEach(([name, qty], index) => {
      console.log(`   ${index + 1}. ${name}: ${qty} units`);
    });

    // Insert transactions
    if (transactions.length > 0) {
      console.log(
        `\n💾 Inserting ${transactions.length} tobacco transactions into database...`
      );

      const insertResult = await transactionCollection.insertMany(transactions);
      console.log(
        `✅ Successfully inserted ${insertResult.insertedCount} transactions`
      );

      // Verification
      const verifyCount = await transactionCollection.countDocuments({
        timestamp: {
          $gte: new Date("2025-10-01T00:00:00.000Z"),
          $lt: new Date("2025-11-01T00:00:00.000Z"),
        },
        items: { $elemMatch: { category: "Tobacco" } },
      });

      const verifyTotal = await transactionCollection
        .aggregate([
          {
            $match: {
              timestamp: {
                $gte: new Date("2025-10-01T00:00:00.000Z"),
                $lt: new Date("2025-11-01T00:00:00.000Z"),
              },
              items: { $elemMatch: { category: "Tobacco" } },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$total" },
            },
          },
        ])
        .toArray();

      console.log(`\n✅ Verification:`);
      console.log(`   October tobacco transactions in DB: ${verifyCount}`);
      console.log(
        `   Total October tobacco sales: $${
          verifyTotal[0]?.total.toFixed(2) || 0
        }`
      );

      // Final summary with all categories for October
      console.log(`\n🏁 October 2025 Sales Summary:`);

      // Get all October sales by category
      const categoryBreakdown = await transactionCollection
        .aggregate([
          {
            $match: {
              timestamp: {
                $gte: new Date("2025-10-01T00:00:00.000Z"),
                $lt: new Date("2025-11-01T00:00:00.000Z"),
              },
            },
          },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.category",
              total: { $sum: "$total" },
              transactions: { $addToSet: "$transactionId" },
            },
          },
          {
            $project: {
              category: "$_id",
              total: 1,
              transactionCount: { $size: "$transactions" },
            },
          },
          { $sort: { total: -1 } },
        ])
        .toArray();

      categoryBreakdown.forEach((cat) => {
        console.log(
          `   ${cat.category}: $${cat.total.toFixed(2)} (${
            cat.transactionCount
          } transactions)`
        );
      });

      console.log(`\n🎉 October 2025 tobacco sales generation complete!`);
    } else {
      console.log("❌ No transactions generated");
    }
  } catch (error) {
    console.error("Error generating October tobacco sales:", error);
  } finally {
    await client.close();
  }
}

generateTobaccoSalesOctober();
