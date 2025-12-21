const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function generateNovemberLotterySales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const transactionCollection = db.collection("transactions");

    console.log(
      "\n🎰 Generating November 2025 lottery sales targeting $31,000..."
    );

    // Check if November lottery data already exists
    const existingNovemberLottery = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
        items: {
          $elemMatch: {
            category: { $in: ["Lotto", "Lotto instant"] },
          },
        },
      })
      .toArray();

    if (existingNovemberLottery.length > 0) {
      console.log(
        `⚠️  Found ${existingNovemberLottery.length} existing November lottery transactions. Deleting first...`
      );

      const deleteResult = await transactionCollection.deleteMany({
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
        items: {
          $elemMatch: {
            category: { $in: ["Lotto", "Lotto instant"] },
          },
        },
      });

      console.log(
        `✅ Cleared existing November lottery data (${deleteResult.deletedCount} transactions)`
      );
    }

    // Get starting transaction ID for November lottery
    const existingNovemberTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
      })
      .sort({ transactionId: -1 })
      .limit(1)
      .toArray();

    let currentTransactionId = 98001; // Start from clean range for November lottery
    if (existingNovemberTransactions.length > 0) {
      currentTransactionId = Math.max(
        currentTransactionId,
        existingNovemberTransactions[0].transactionId + 1
      );
    }

    console.log(`🆔 Starting transaction ID: ${currentTransactionId}`);

    // Target and tracking
    const targetAmount = 31000;
    const cardLimit = 15000; // $15k card transaction limit
    let totalGenerated = 0;
    let cardAmountGenerated = 0;
    const transactions = [];

    // Payment method distribution (consistent with previous lottery months)
    const paymentMethods = [
      { method: "cash", percentage: 65 },
      { method: "card", percentage: 35 },
    ];

    // Lottery ticket items following August pattern (Lotto and Lotto instant categories)
    const lotteryItems = [
      // Instant tickets (Lotto instant category)
      { name: "Scratch Ticket $1", category: "Lotto instant", price: 1 },
      { name: "Scratch Ticket $2", category: "Lotto instant", price: 2 },
      { name: "Scratch Ticket $5", category: "Lotto instant", price: 5 },
      { name: "Scratch Ticket $10", category: "Lotto instant", price: 10 },
      { name: "Scratch Ticket $20", category: "Lotto instant", price: 20 },
      { name: "Scratch Ticket $30", category: "Lotto instant", price: 30 },
      { name: "Instant Crossword", category: "Lotto instant", price: 5 },
      { name: "Crossword", category: "Lotto instant", price: 3 },
      { name: "Bingo", category: "Lotto instant", price: 5 },
      { name: "Monopoly", category: "Lotto instant", price: 10 },
      { name: "Blackjack", category: "Lotto instant", price: 5 },
      { name: "Poker", category: "Lotto instant", price: 10 },
      { name: "Lucky 7s", category: "Lotto instant", price: 2 },
      { name: "Triple 777", category: "Lotto instant", price: 5 },
      { name: "Cash Blast", category: "Lotto instant", price: 10 },
      { name: "Money Bags", category: "Lotto instant", price: 20 },
      { name: "Diamond Dollars", category: "Lotto instant", price: 30 },
      { name: "Gold Rush", category: "Lotto instant", price: 10 },

      // Draw games (Lotto category)
      { name: "Powerball", category: "Lotto", price: 2 },
      { name: "Mega Millions", category: "Lotto", price: 2 },
      { name: "Pick 3", category: "Lotto", price: 1 },
      { name: "Pick 4", category: "Lotto", price: 1 },
      { name: "Cash 5", category: "Lotto", price: 1 },
      { name: "Lucky for Life", category: "Lotto", price: 2 },
      { name: "Daily Derby", category: "Lotto", price: 2 },
      { name: "SuperLotto Plus", category: "Lotto", price: 1 },
      { name: "Fantasy 5", category: "Lotto", price: 1 },
      { name: "Daily 3", category: "Lotto", price: 1 },
      { name: "Daily 4", category: "Lotto", price: 1 },
      { name: "Hot Spot", category: "Lotto", price: 1 },
      { name: "Keno", category: "Lotto", price: 1 },
      { name: "All or Nothing", category: "Lotto", price: 2 },
    ];

    console.log(`🎫 Using ${lotteryItems.length} lottery items`);
    console.log(
      `📅 Generating lottery transactions for November 1-30, 2025...`
    );

    // Generate transactions day by day
    for (let day = 1; day <= 30; day++) {
      const date = new Date(
        `2025-11-${day.toString().padStart(2, "0")}T00:00:00.000Z`
      );
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

      // Lottery sales patterns by day of week - increased for November ($31k target)
      let dailyTransactionCount;
      if (dayOfWeek === 0) {
        // Sunday
        dailyTransactionCount = Math.floor(Math.random() * 20) + 35; // 35-55
      } else if (dayOfWeek === 6) {
        // Saturday
        dailyTransactionCount = Math.floor(Math.random() * 25) + 45; // 45-70
      } else if (dayOfWeek === 5) {
        // Friday
        dailyTransactionCount = Math.floor(Math.random() * 23) + 40; // 40-63
      } else {
        // Monday-Thursday
        dailyTransactionCount = Math.floor(Math.random() * 20) + 30; // 30-50
      }

      // Generate transactions for this day
      for (let i = 0; i < dailyTransactionCount; i++) {
        // Continue until we're close to target
        if (totalGenerated >= targetAmount * 0.98) break; // Stop at 98% of target

        // Random time during business hours (6 AM to 11 PM)
        const hour = Math.floor(Math.random() * 17) + 6; // 6-22
        const minute = Math.floor(Math.random() * 60);
        const second = Math.floor(Math.random() * 60);

        const timestamp = new Date(date);
        timestamp.setUTCHours(hour, minute, second);

        // Generate 1-4 lottery items per transaction - favor higher value items to reach target
        const itemCount =
          Math.random() < 0.25
            ? 1
            : Math.random() < 0.55
            ? 2
            : Math.random() < 0.8
            ? 3
            : 4;

        const items = [];
        let subtotal = 0;

        for (let j = 0; j < itemCount; j++) {
          // Favor higher-priced items to reach higher target
          let item;
          if (totalGenerated < targetAmount * 0.4) {
            // First 40% - mix of all items
            item =
              lotteryItems[Math.floor(Math.random() * lotteryItems.length)];
          } else {
            // Second 60% - heavily favor higher-priced items for $31k target
            const highValueItems = lotteryItems.filter((i) => i.price >= 10);
            const regularItems = lotteryItems;
            item =
              Math.random() < 0.7
                ? highValueItems[
                    Math.floor(Math.random() * highValueItems.length)
                  ]
                : regularItems[Math.floor(Math.random() * regularItems.length)];
          }

          const quantity =
            Math.random() < 0.65 ? 1 : Math.random() < 0.85 ? 2 : 3;

          items.push({
            product_id: `lottery-${Date.now()}-${j}`,
            name: item.name,
            quantity: quantity,
            price: item.price,
            applyTax: false,
            category: item.category,
          });

          subtotal += item.price * quantity;
        }

        // Determine payment method with strict card limit enforcement
        let paymentMethod = "cash";
        let cardAmount = 0;
        let cashAmount = subtotal;

        const rand = Math.random();
        if (rand < 0.32 && cardAmountGenerated + subtotal <= cardLimit) {
          paymentMethod = "card";
          cardAmount = subtotal;
          cashAmount = 0;
          cardAmountGenerated += subtotal;
        }

        const transaction = {
          transactionId: currentTransactionId++,
          legacy_id: null,
          timestamp: timestamp,
          subtotal: subtotal,
          taxableAmount: 0,
          nonTaxableAmount: subtotal,
          tax: 0,
          total: subtotal,
          cashback: 0,
          paymentBreakdown: [
            {
              method: paymentMethod,
              amount: subtotal,
            },
          ],
          change: 0,
          transactionType: paymentMethod,
          cashAmount: cashAmount,
          cardAmount: cardAmount,
          creditAmount: 0,
          items: items,
        };

        transactions.push(transaction);
        totalGenerated += subtotal;

        // Progress indicator
        if (transactions.length % 100 === 0) {
          console.log(
            `   Generated ${
              transactions.length
            } transactions, total: $${totalGenerated.toFixed(2)}`
          );
        }
      }

      // Continue generating if we haven't hit target yet
      if (totalGenerated >= targetAmount * 0.98) break;
    }

    console.log(`\n📊 Generation Summary:`);
    console.log(`   Target: $${targetAmount.toFixed(2)}`);
    console.log(`   Generated: $${totalGenerated.toFixed(2)}`);
    console.log(
      `   Accuracy: ${((totalGenerated / targetAmount) * 100).toFixed(1)}%`
    );
    console.log(`   Total Transactions: ${transactions.length}`);
    console.log(
      `   Card Amount: $${cardAmountGenerated.toFixed(
        2
      )} (limit: $${cardLimit})`
    );

    // Payment method analysis
    const paymentBreakdown = {};
    transactions.forEach((tx) => {
      const method = tx.transactionType;
      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + 1;
    });

    console.log(`\n💳 Payment Method Distribution:`);
    Object.entries(paymentBreakdown).forEach(([method, count]) => {
      const percentage = ((count / transactions.length) * 100).toFixed(1);
      console.log(`   ${method}: ${count} transactions (${percentage}%)`);
    });

    // Category analysis
    const categoryBreakdown = {};
    let totalItems = 0;
    transactions.forEach((tx) => {
      tx.items.forEach((item) => {
        categoryBreakdown[item.category] =
          (categoryBreakdown[item.category] || 0) + item.quantity;
        totalItems += item.quantity;
      });
    });

    console.log(`\n🎫 Category Distribution:`);
    Object.entries(categoryBreakdown).forEach(([category, count]) => {
      const percentage = ((count / totalItems) * 100).toFixed(1);
      console.log(`   ${category}: ${count} items (${percentage}%)`);
    });

    // Top selling items
    const itemSales = {};
    transactions.forEach((tx) => {
      tx.items.forEach((item) => {
        itemSales[item.name] = (itemSales[item.name] || 0) + item.quantity;
      });
    });

    const topItems = Object.entries(itemSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    console.log(`\n🏆 Top 10 lottery items sold:`);
    topItems.forEach(([name, count], index) => {
      console.log(`   ${index + 1}. ${name}: ${count} units`);
    });

    // Insert transactions
    console.log(
      `\n💾 Inserting ${transactions.length} lottery transactions into database...`
    );

    const insertResult = await transactionCollection.insertMany(transactions);
    console.log(
      `✅ Successfully inserted ${insertResult.insertedCount} transactions`
    );

    // Verification
    const verifyCount = await transactionCollection.countDocuments({
      timestamp: {
        $gte: new Date("2025-11-01T00:00:00.000Z"),
        $lt: new Date("2025-12-01T00:00:00.000Z"),
      },
      items: {
        $elemMatch: {
          category: { $in: ["Lotto", "Lotto instant"] },
        },
      },
    });

    const verifyTotal = await transactionCollection
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date("2025-11-01T00:00:00.000Z"),
              $lt: new Date("2025-12-01T00:00:00.000Z"),
            },
            items: {
              $elemMatch: {
                category: { $in: ["Lotto", "Lotto instant"] },
              },
            },
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
    console.log(`   November lottery transactions in DB: ${verifyCount}`);
    console.log(
      `   Total November lottery sales: $${
        verifyTotal[0]?.total.toFixed(2) || 0
      }`
    );

    console.log(`\n🎉 November 2025 lottery sales generation complete!`);
  } catch (error) {
    console.error("Error generating November lottery sales:", error);
  } finally {
    await client.close();
  }
}

generateNovemberLotterySales();
