const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function enhanceLotterySalesJuly() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const transactionCollection = db.collection("transactions");

    console.log(
      "\n🎰 Enhancing July 2025 lottery sales to reach $19,872 target..."
    );

    // Check current lottery sales
    const currentLotterySales = await transactionCollection
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date("2025-07-01T00:00:00.000Z"),
              $lt: new Date("2025-08-01T00:00:00.000Z"),
            },
            $or: [
              { items: { $elemMatch: { category: "Lotto" } } },
              { items: { $elemMatch: { category: "Lotto Instant" } } },
            ],
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const currentTotal = currentLotterySales[0]?.total || 0;
    const currentCount = currentLotterySales[0]?.count || 0;
    const targetAmount = 19872;
    const remainingAmount = targetAmount - currentTotal;

    console.log(
      `💰 Current lottery sales: $${currentTotal.toFixed(
        2
      )} (${currentCount} transactions)`
    );
    console.log(`🎯 Target: $${targetAmount.toFixed(2)}`);
    console.log(`📈 Remaining needed: $${remainingAmount.toFixed(2)}`);

    if (remainingAmount <= 0) {
      console.log(
        `✅ Target already reached! No additional transactions needed.`
      );
      return;
    }

    // Higher value lottery items to reach target faster
    const premiumLottoItems = [
      { name: "Lotto Max $20.00", category: "Lotto", price: 20.0, weight: 25 },
      {
        name: "Lotto $50.00 Weekly",
        category: "Lotto",
        price: 50.0,
        weight: 15,
      },
      {
        name: "Lotto $25.00 Special",
        category: "Lotto",
        price: 25.0,
        weight: 20,
      },
      {
        name: "Lotto $30.00 Jackpot",
        category: "Lotto",
        price: 30.0,
        weight: 15,
      },
      { name: "Lotto $15.00", category: "Lotto", price: 15.0, weight: 25 },
    ];

    const premiumInstantItems = [
      {
        name: "Diamond Millions $50",
        category: "Lotto Instant",
        price: 50.0,
        weight: 10,
      },
      {
        name: "Monopoly Deluxe",
        category: "Lotto Instant",
        price: 30.0,
        weight: 15,
      },
      {
        name: "Cash Explosion",
        category: "Lotto Instant",
        price: 25.0,
        weight: 20,
      },
      {
        name: "Mega Crossword",
        category: "Lotto Instant",
        price: 20.0,
        weight: 25,
      },
      {
        name: "Big Money Bingo",
        category: "Lotto Instant",
        price: 15.0,
        weight: 30,
      },
    ];

    // Get next transaction ID
    const lastTransaction = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
      })
      .sort({ transactionId: -1 })
      .limit(1)
      .toArray();

    let currentTransactionId =
      lastTransaction.length > 0 ? lastTransaction[0].transactionId + 1 : 79001;

    console.log(
      `🆔 Starting enhancement from transaction ID: ${currentTransactionId}`
    );

    // Check card capacity
    const julyCardTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
        paymentMethod: "card",
      })
      .toArray();

    const currentCardTotal = julyCardTransactions.reduce(
      (sum, t) => sum + t.total,
      0
    );
    const remainingCardCapacity = 15000 - currentCardTotal;

    console.log(`💳 Current July card usage: $${currentCardTotal.toFixed(2)}`);
    console.log(
      `💳 Remaining card capacity: $${remainingCardCapacity.toFixed(2)}`
    );

    const transactions = [];
    let totalGenerated = 0;
    let cardUsed = 0;
    const maxCardForEnhancement = Math.min(
      remainingCardCapacity * 0.8,
      remainingAmount * 0.2
    );

    console.log(
      `💳 Max additional card for lottery: $${maxCardForEnhancement.toFixed(2)}`
    );

    // Business hours: 7 AM to 9 PM
    const businessHours = { start: 7, end: 21 };
    const daysInJuly = 31;

    // Helper function to select weighted random item
    function selectWeightedItem(items) {
      const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
      let random = Math.random() * totalWeight;

      for (const item of items) {
        random -= item.weight;
        if (random <= 0) return item;
      }
      return items[items.length - 1];
    }

    console.log(`📅 Generating premium lottery transactions...`);

    while (totalGenerated < remainingAmount) {
      // Random day in July
      const day = Math.floor(Math.random() * daysInJuly) + 1;
      const hour =
        Math.floor(Math.random() * (businessHours.end - businessHours.start)) +
        businessHours.start;
      const minute = Math.floor(Math.random() * 60);

      const timestamp = new Date(2025, 6, day, hour, minute);

      const transactionItems = [];
      let subtotal = 0;

      // Higher chance of multiple premium tickets per transaction
      const transactionType = Math.random();

      if (transactionType < 0.5) {
        // Premium Lotto (1-2 tickets)
        const itemCount = Math.random() < 0.7 ? 1 : 2;
        for (let i = 0; i < itemCount; i++) {
          const selectedItem = selectWeightedItem(premiumLottoItems);

          transactionItems.push({
            name: selectedItem.name,
            category: selectedItem.category,
            price: selectedItem.price,
            quantity: 1,
            total: selectedItem.price,
            taxable: false,
          });

          subtotal += selectedItem.price;
        }
      } else if (transactionType < 0.85) {
        // Premium Instant (1-2 tickets)
        const itemCount = Math.random() < 0.8 ? 1 : 2;
        for (let i = 0; i < itemCount; i++) {
          const selectedItem = selectWeightedItem(premiumInstantItems);

          transactionItems.push({
            name: selectedItem.name,
            category: selectedItem.category,
            price: selectedItem.price,
            quantity: 1,
            total: selectedItem.price,
            taxable: false,
          });

          subtotal += selectedItem.price;
        }
      } else {
        // Premium Mixed (1 of each)
        const lottoItem = selectWeightedItem(premiumLottoItems);
        const instantItem = selectWeightedItem(premiumInstantItems);

        transactionItems.push({
          name: lottoItem.name,
          category: lottoItem.category,
          price: lottoItem.price,
          quantity: 1,
          total: lottoItem.price,
          taxable: false,
        });

        transactionItems.push({
          name: instantItem.name,
          category: instantItem.category,
          price: instantItem.price,
          quantity: 1,
          total: instantItem.price,
          taxable: false,
        });

        subtotal = lottoItem.price + instantItem.price;
      }

      const tax = 0;
      const total = subtotal;

      // Skip if this would exceed our target
      if (totalGenerated + total > remainingAmount + 25) {
        continue;
      }

      // Payment method - mostly cash to stay under limit
      let paymentMethod = "cash";
      if (cardUsed + total <= maxCardForEnhancement && Math.random() < 0.15) {
        paymentMethod = "card";
        cardUsed += total;
      }

      const transaction = {
        transactionId: currentTransactionId,
        timestamp: timestamp,
        items: transactionItems,
        subtotal: subtotal,
        tax: tax,
        total: total,
        taxableAmount: 0,
        nonTaxableAmount: subtotal,
        includeTax: false,
        paymentMethod: paymentMethod,
        paymentBreakdown: [
          {
            method: paymentMethod,
            amount: total,
          },
        ],
        cashAmount: paymentMethod === "cash" ? total : 0,
        cardAmount: paymentMethod === "card" ? total : 0,
        cashback: 0,
        finalTotal: total,
        receiptNumber: `RCP${currentTransactionId + 1}`,
        cashier: "Admin User",
        createdAt: timestamp,
        transactionType: paymentMethod,
      };

      transactions.push(transaction);
      totalGenerated += total;
      currentTransactionId++;

      // Progress logging every 25 transactions
      if (transactions.length % 25 === 0) {
        console.log(
          `   Generated ${
            transactions.length
          } premium transactions, total: $${totalGenerated.toFixed(2)}`
        );
      }

      // Safety break
      if (transactions.length > 500) {
        console.log("⚠️  Reached 500 enhancement transactions, stopping");
        break;
      }
    }

    console.log(`\n📊 Enhancement Summary:`);
    console.log(`   Additional needed: $${remainingAmount.toFixed(2)}`);
    console.log(`   Additional generated: $${totalGenerated.toFixed(2)}`);
    console.log(
      `   Enhancement accuracy: ${(
        (totalGenerated / remainingAmount) *
        100
      ).toFixed(1)}%`
    );
    console.log(`   Additional transactions: ${transactions.length}`);

    if (transactions.length > 0) {
      console.log(
        `\n💾 Inserting ${transactions.length} premium lottery transactions...`
      );

      const insertResult = await transactionCollection.insertMany(transactions);
      console.log(
        `✅ Successfully inserted ${insertResult.insertedCount} transactions`
      );

      // Final verification
      const finalLotterySales = await transactionCollection
        .aggregate([
          {
            $match: {
              timestamp: {
                $gte: new Date("2025-07-01T00:00:00.000Z"),
                $lt: new Date("2025-08-01T00:00:00.000Z"),
              },
              $or: [
                { items: { $elemMatch: { category: "Lotto" } } },
                { items: { $elemMatch: { category: "Lotto Instant" } } },
              ],
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$total" },
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();

      const finalTotal = finalLotterySales[0]?.total || 0;
      const finalCount = finalLotterySales[0]?.count || 0;

      console.log(`\n✅ Final July Lottery Results:`);
      console.log(`   Total sales: $${finalTotal.toFixed(2)}`);
      console.log(`   Target: $${targetAmount.toFixed(2)}`);
      console.log(
        `   Accuracy: ${((finalTotal / targetAmount) * 100).toFixed(1)}%`
      );
      console.log(`   Total transactions: ${finalCount}`);

      // Final card check
      const finalCardCheck = await transactionCollection
        .find({
          timestamp: {
            $gte: new Date("2025-07-01T00:00:00.000Z"),
            $lt: new Date("2025-08-01T00:00:00.000Z"),
          },
          paymentMethod: "card",
        })
        .toArray();

      const finalCardTotal = finalCardCheck.reduce(
        (sum, t) => sum + t.total,
        0
      );
      console.log(
        `\n💳 Final July Card Usage: $${finalCardTotal.toFixed(2)} / $15,000`
      );

      console.log(`\n🎉 July 2025 lottery sales enhancement complete!`);
    }
  } catch (error) {
    console.error("Error enhancing July lottery sales:", error);
  } finally {
    await client.close();
  }
}

enhanceLotterySalesJuly();
