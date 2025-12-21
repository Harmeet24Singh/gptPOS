const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function generateLotterySalesJuly() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const transactionCollection = db.collection("transactions");

    console.log("\n🎰 Generating July 2025 lottery sales targeting $19,872...");

    // Based on December patterns, create lottery items
    const lottoItems = [
      { name: "Lotto Winnings", category: "Lotto", price: 5.0, weight: 30 }, // Most popular
      { name: "Lotto $5.00", category: "Lotto", price: 5.0, weight: 15 },
      { name: "Lotto $10.00", category: "Lotto", price: 10.0, weight: 12 },
      { name: "Lotto $6.00", category: "Lotto", price: 6.0, weight: 10 },
      { name: "Lotto $1.00", category: "Lotto", price: 1.0, weight: 8 },
      { name: "Lotto $11.00", category: "Lotto", price: 11.0, weight: 8 },
      { name: "Lotto $2.00", category: "Lotto", price: 2.0, weight: 7 },
      { name: "Lotto $3.00", category: "Lotto", price: 3.0, weight: 6 },
      { name: "Lotto $20.00", category: "Lotto", price: 20.0, weight: 4 },
    ];

    const lottoInstantItems = [
      { name: "Crossword", category: "Lotto Instant", price: 5.0, weight: 15 },
      { name: "Big Play", category: "Lotto Instant", price: 10.0, weight: 15 },
      { name: "Plinko", category: "Lotto Instant", price: 5.0, weight: 12 },
      { name: "Bingo", category: "Lotto Instant", price: 3.0, weight: 10 },
      {
        name: "Cash Blast",
        category: "Lotto Instant",
        price: 10.0,
        weight: 10,
      },
      { name: "Lucky 7s", category: "Lotto Instant", price: 2.0, weight: 8 },
      { name: "Monopoly", category: "Lotto Instant", price: 20.0, weight: 6 },
      {
        name: "Wheel of Fortune",
        category: "Lotto Instant",
        price: 5.0,
        weight: 8,
      },
      {
        name: "Cash for Life",
        category: "Lotto Instant",
        price: 10.0,
        weight: 7,
      },
      {
        name: "Diamond Millions",
        category: "Lotto Instant",
        price: 20.0,
        weight: 4,
      },
      {
        name: "Scratch & Win",
        category: "Lotto Instant",
        price: 1.0,
        weight: 5,
      },
    ];

    console.log(
      `🎫 Using ${lottoItems.length} Lotto items and ${lottoInstantItems.length} Lotto Instant items`
    );

    // Get starting transaction ID for July lottery
    const existingJulyTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
      })
      .sort({ transactionId: -1 })
      .limit(1)
      .toArray();

    let currentTransactionId = 77001; // Start from lottery range for July
    if (existingJulyTransactions.length > 0) {
      currentTransactionId = Math.max(
        currentTransactionId,
        existingJulyTransactions[0].transactionId + 1
      );
    }

    console.log(`🆔 Starting transaction ID: ${currentTransactionId}`);

    // Check current July card usage
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

    // Target and tracking
    const targetAmount = 19872;
    let totalGenerated = 0;
    let cardUsed = 0;
    const transactions = [];

    // Payment method distribution - start with cash-heavy to stay under card limit
    const maxCardForLottery = Math.min(
      remainingCardCapacity * 0.9,
      targetAmount * 0.3
    ); // Max 30% card or 90% of remaining capacity
    console.log(
      `💳 Max card amount for lottery: $${maxCardForLottery.toFixed(2)}`
    );

    // Business hours: 7 AM to 9 PM
    const businessHours = { start: 7, end: 21 };

    // Generate transactions throughout July 2025
    const daysInJuly = 31;

    console.log(`📅 Generating lottery transactions for July 1-31, 2025...`);

    // Helper function to select weighted random item
    function selectWeightedItem(items) {
      const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
      let random = Math.random() * totalWeight;

      for (const item of items) {
        random -= item.weight;
        if (random <= 0) return item;
      }
      return items[items.length - 1]; // fallback
    }

    while (totalGenerated < targetAmount) {
      // Random day in July
      const day = Math.floor(Math.random() * daysInJuly) + 1;
      const hour =
        Math.floor(Math.random() * (businessHours.end - businessHours.start)) +
        businessHours.start;
      const minute = Math.floor(Math.random() * 60);

      const timestamp = new Date(2025, 6, day, hour, minute); // Month is 0-indexed (6 = July)

      // Create realistic lottery purchase (1-4 tickets, sometimes mixing categories)
      const transactionItems = [];
      let subtotal = 0;

      // Determine transaction type: Lotto only (60%), Instant only (30%), or Mixed (10%)
      const transactionType = Math.random();
      let itemCount;

      if (transactionType < 0.6) {
        // Lotto only (1-3 tickets)
        itemCount = Math.random() < 0.7 ? 1 : Math.random() < 0.9 ? 2 : 3;
        for (let i = 0; i < itemCount; i++) {
          const selectedItem = selectWeightedItem(lottoItems);
          const quantity = 1; // Lottery tickets typically sold 1 at a time

          const itemTotal = selectedItem.price * quantity;
          subtotal += itemTotal;

          transactionItems.push({
            name: selectedItem.name,
            category: selectedItem.category,
            price: selectedItem.price,
            quantity: quantity,
            total: itemTotal,
            taxable: false,
          });
        }
      } else if (transactionType < 0.9) {
        // Instant only (1-2 tickets)
        itemCount = Math.random() < 0.8 ? 1 : 2;
        for (let i = 0; i < itemCount; i++) {
          const selectedItem = selectWeightedItem(lottoInstantItems);
          const quantity = 1;

          const itemTotal = selectedItem.price * quantity;
          subtotal += itemTotal;

          transactionItems.push({
            name: selectedItem.name,
            category: selectedItem.category,
            price: selectedItem.price,
            quantity: quantity,
            total: itemTotal,
            taxable: false,
          });
        }
      } else {
        // Mixed (1 lotto + 1 instant)
        const lottoItem = selectWeightedItem(lottoItems);
        const instantItem = selectWeightedItem(lottoInstantItems);

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

      // Since lottery is non-taxable, no tax calculation needed
      const tax = 0;
      const total = subtotal;

      // Skip if this would exceed our target by too much
      if (totalGenerated + total > targetAmount + 50) {
        continue;
      }

      // Payment method selection - prioritize cash to stay under card limit
      let paymentMethod = "cash";
      if (cardUsed + total <= maxCardForLottery && Math.random() < 0.25) {
        // 25% chance for card if under limit
        paymentMethod = "card";
        cardUsed += total;
      }

      // Create transaction with mandatory paymentBreakdown array
      const transaction = {
        transactionId: currentTransactionId,
        timestamp: timestamp,
        items: transactionItems,
        subtotal: subtotal,
        tax: tax,
        total: total,
        taxableAmount: 0, // Lottery is non-taxable
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

      // Progress logging every 50 transactions
      if (transactions.length % 50 === 0) {
        console.log(
          `   Generated ${
            transactions.length
          } transactions, total: $${totalGenerated.toFixed(2)}`
        );
      }

      // Safety break to avoid infinite loop
      if (transactions.length > 1500) {
        console.log("⚠️  Reached 1500 transactions, stopping generation");
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
    console.log(`   Card Amount Used: $${cardUsed.toFixed(2)}`);

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

    // Category analysis
    let lottoOnlyCount = 0;
    let instantOnlyCount = 0;
    let mixedCount = 0;
    let lottoTotal = 0;
    let instantTotal = 0;

    transactions.forEach((t) => {
      const hasLotto = t.items.some((item) => item.category === "Lotto");
      const hasInstant = t.items.some(
        (item) => item.category === "Lotto Instant"
      );

      if (hasLotto && !hasInstant) {
        lottoOnlyCount++;
      } else if (hasInstant && !hasLotto) {
        instantOnlyCount++;
      } else if (hasLotto && hasInstant) {
        mixedCount++;
      }

      t.items.forEach((item) => {
        if (item.category === "Lotto") {
          lottoTotal += item.total;
        } else if (item.category === "Lotto Instant") {
          instantTotal += item.total;
        }
      });
    });

    console.log(`\n🎰 Transaction Type Distribution:`);
    console.log(`   Lotto Only: ${lottoOnlyCount} transactions`);
    console.log(`   Instant Only: ${instantOnlyCount} transactions`);
    console.log(`   Mixed: ${mixedCount} transactions`);

    console.log(`\n💰 Category Sales Breakdown:`);
    console.log(
      `   Lotto Sales: $${lottoTotal.toFixed(2)} (${(
        (lottoTotal / totalGenerated) *
        100
      ).toFixed(1)}%)`
    );
    console.log(
      `   Instant Sales: $${instantTotal.toFixed(2)} (${(
        (instantTotal / totalGenerated) *
        100
      ).toFixed(1)}%)`
    );

    // Item frequency analysis
    const itemFrequency = {};
    let totalTickets = 0;
    transactions.forEach((t) => {
      t.items.forEach((item) => {
        const key = `${item.category}: ${item.name}`;
        itemFrequency[key] = (itemFrequency[key] || 0) + item.quantity;
        totalTickets += item.quantity;
      });
    });

    console.log(`\n📦 Ticket Analysis:`);
    console.log(`   Total tickets sold: ${totalTickets}`);
    console.log(
      `   Average tickets per transaction: ${(
        totalTickets / transactions.length
      ).toFixed(1)}`
    );

    // Show top selling lottery items
    const sortedItems = Object.entries(itemFrequency).sort(
      (a, b) => b[1] - a[1]
    );
    console.log(`\n🏆 Top 15 lottery items sold:`);
    sortedItems.slice(0, 15).forEach(([name, qty], index) => {
      console.log(`   ${index + 1}. ${name}: ${qty} tickets`);
    });

    // Insert transactions
    if (transactions.length > 0) {
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
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
        $or: [
          { items: { $elemMatch: { category: "Lotto" } } },
          { items: { $elemMatch: { category: "Lotto Instant" } } },
        ],
      });

      const verifyTotal = await transactionCollection
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
            },
          },
        ])
        .toArray();

      console.log(`\n✅ Verification:`);
      console.log(`   July lottery transactions in DB: ${verifyCount}`);
      console.log(
        `   Total July lottery sales: $${verifyTotal[0]?.total.toFixed(2) || 0}`
      );

      // Final card usage check
      const finalJulyCardCheck = await transactionCollection
        .find({
          timestamp: {
            $gte: new Date("2025-07-01T00:00:00.000Z"),
            $lt: new Date("2025-08-01T00:00:00.000Z"),
          },
          paymentMethod: "card",
        })
        .toArray();

      const totalJulyCard = finalJulyCardCheck.reduce(
        (sum, t) => sum + t.total,
        0
      );
      console.log(
        `\n💳 Final July Card Usage: $${totalJulyCard.toFixed(2)} / $15,000`
      );
      console.log(
        `   Remaining capacity: $${(15000 - totalJulyCard).toFixed(2)}`
      );

      console.log(`\n🎉 July 2025 lottery sales generation complete!`);
    } else {
      console.log("❌ No transactions generated");
    }
  } catch (error) {
    console.error("Error generating July lottery sales:", error);
  } finally {
    await client.close();
  }
}

generateLotterySalesJuly();
