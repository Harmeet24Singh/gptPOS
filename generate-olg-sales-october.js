const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function generateOLGSalesOctober() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Target: ~$29,000 in OLG sales for October 2025
    const targetAmount = 29000;
    let currentTotal = 0;
    const transactions = [];

    // OLG Products - Instant Tickets and Lottery Games
    const olgProducts = [
      // Instant Tickets ($1-$30 range)
      {
        name: "Instant Crossword Tripler $1",
        category: "Lotto",
        price: 1.0,
        type: "instant",
      },
      {
        name: "Lucky Lines $2",
        category: "Lotto",
        price: 2.0,
        type: "instant",
      },
      {
        name: "Bingo Doubler $3",
        category: "Lotto",
        price: 3.0,
        type: "instant",
      },
      {
        name: "Money Multiplier $5",
        category: "Lotto",
        price: 5.0,
        type: "instant",
      },
      {
        name: "Wheel of Fortune $5",
        category: "Lotto",
        price: 5.0,
        type: "instant",
      },
      { name: "Cashingo $10", category: "Lotto", price: 10.0, type: "instant" },
      {
        name: "Diamond 7s $10",
        category: "Lotto",
        price: 10.0,
        type: "instant",
      },
      {
        name: "Cash For Life $20",
        category: "Lotto",
        price: 20.0,
        type: "instant",
      },
      {
        name: "Extreme Millions $30",
        category: "Lotto",
        price: 30.0,
        type: "instant",
      },

      // Draw Games
      {
        name: "Lotto 6/49 Quick Pick",
        category: "Lotto",
        price: 3.0,
        type: "draw",
      },
      {
        name: "Lotto Max Quick Pick",
        category: "Lotto",
        price: 5.0,
        type: "draw",
      },
      {
        name: "Ontario 49 Quick Pick",
        category: "Lotto",
        price: 1.0,
        type: "draw",
      },
      { name: "Poker Lotto", category: "Lotto", price: 2.0, type: "draw" },
      { name: "Daily Grand", category: "Lotto", price: 3.0, type: "draw" },
      { name: "Pick-3 Midday", category: "Lotto", price: 1.0, type: "draw" },
      { name: "Pick-3 Evening", category: "Lotto", price: 1.0, type: "draw" },
      { name: "Pick-4 Midday", category: "Lotto", price: 1.0, type: "draw" },
      { name: "Pick-4 Evening", category: "Lotto", price: 1.0, type: "draw" },
      { name: "Keno", category: "Lotto", price: 1.0, type: "draw" },
      { name: "Encore", category: "Lotto", price: 1.0, type: "draw" },

      // Multi-draw packages
      {
        name: "Lotto 6/49 - 5 draws",
        category: "Lotto",
        price: 15.0,
        type: "multi",
      },
      {
        name: "Lotto Max - 3 draws",
        category: "Lotto",
        price: 15.0,
        type: "multi",
      },
      {
        name: "Daily Grand - 10 draws",
        category: "Lotto",
        price: 30.0,
        type: "multi",
      },
    ];

    // Helper function to get random date in October 2025
    function getRandomOctoberDate() {
      const start = new Date("2025-10-01T06:00:00Z");
      const end = new Date("2025-10-31T23:59:59Z");
      const randomTime =
        start.getTime() + Math.random() * (end.getTime() - start.getTime());
      return new Date(randomTime);
    }

    // Helper function to get day-of-week multiplier for sales patterns
    function getDayMultiplier(date) {
      const day = date.getDay();
      // Weekend and Friday are busier for lottery
      if (day === 5) return 1.4; // Friday
      if (day === 6) return 1.3; // Saturday
      if (day === 0) return 1.2; // Sunday
      if (day === 1) return 0.8; // Monday
      return 1.0; // Tue-Thu
    }

    // Helper function to get hour multiplier for peak times
    function getHourMultiplier(hour) {
      if (hour >= 7 && hour <= 9) return 1.3; // Morning commute
      if (hour >= 11 && hour <= 13) return 1.2; // Lunch time
      if (hour >= 17 && hour <= 19) return 1.4; // Evening rush
      if (hour >= 20 && hour <= 22) return 1.1; // Evening
      if (hour >= 6 && hour <= 23) return 1.0; // Regular hours
      return 0.3; // Late night/early morning
    }

    let transactionId = Math.floor(Math.random() * 1000000) + 500000;

    // Generate transactions to reach ~$29,000
    while (currentTotal < targetAmount) {
      const transactionDate = getRandomOctoberDate();
      const dayMultiplier = getDayMultiplier(transactionDate);
      const hourMultiplier = getHourMultiplier(transactionDate.getHours());

      // Determine number of items (1-5 items per transaction, weighted toward smaller amounts)
      const rand = Math.random();
      let numItems;
      if (rand < 0.4) numItems = 1;
      else if (rand < 0.7) numItems = 2;
      else if (rand < 0.9) numItems = 3;
      else if (rand < 0.97) numItems = 4;
      else numItems = 5;

      const items = [];
      let subtotal = 0;

      for (let i = 0; i < numItems; i++) {
        const product =
          olgProducts[Math.floor(Math.random() * olgProducts.length)];
        let quantity = 1;

        // Sometimes people buy multiple of the same ticket
        if (Math.random() < 0.3 && product.price <= 5) {
          quantity = Math.random() < 0.7 ? 2 : 3;
        }

        items.push({
          name: product.name,
          category: product.category,
          price: product.price,
          quantity: quantity,
          taxable: false, // Lottery tickets are not subject to HST
        });

        subtotal += product.price * quantity;
      }

      // Apply day and hour multipliers to frequency (not affecting this transaction)
      const shouldSkip = Math.random() > dayMultiplier * hourMultiplier * 0.4;
      if (shouldSkip && currentTotal < targetAmount * 0.9) continue;

      const tax = 0; // No tax on lottery
      const total = subtotal;

      // Stop if this transaction would exceed target by too much
      if (currentTotal + total > targetAmount + 500) {
        break;
      }

      // Payment breakdown (70% cash, 30% card for lottery sales)
      const paymentBreakdown = [];
      const useCard = Math.random() < 0.3;

      if (useCard) {
        paymentBreakdown.push({ method: "card", amount: total });
      } else {
        paymentBreakdown.push({ method: "cash", amount: total });
      }

      const transaction = {
        id: `olg_${transactionId++}`,
        timestamp: transactionDate.toISOString(),
        items: items,
        subtotal: subtotal,
        tax: tax,
        total: total,
        taxableAmount: 0,
        nonTaxableAmount: subtotal,
        includeTax: false,
        paymentBreakdown: paymentBreakdown,
        transactionType: useCard ? "card" : "cash",
        cashAmount: useCard ? 0 : total,
        cardAmount: useCard ? total : 0,
        creditAmount: 0,
        change: 0,
        cashback: 0,
        finalTotal: total,
        customerName: "",
        notes: `OLG Sales - ${items
          .map((item) => `${item.quantity}x ${item.name}`)
          .join(", ")}`,
      };

      transactions.push(transaction);
      currentTotal += total;

      if (transactions.length % 100 === 0) {
        console.log(
          `Generated ${
            transactions.length
          } OLG transactions, total: $${currentTotal.toFixed(2)}`
        );
      }
    }

    console.log(`\n📊 OLG Sales Summary for October 2025:`);
    console.log(`Total Transactions: ${transactions.length}`);
    console.log(`Total Revenue: $${currentTotal.toFixed(2)}`);
    console.log(`Target: $${targetAmount.toFixed(2)}`);
    console.log(`Difference: $${(currentTotal - targetAmount).toFixed(2)}`);

    // Calculate breakdown by product type
    const instantTotal = transactions.reduce((sum, t) => {
      const instantAmount = t.items
        .filter(
          (item) =>
            item.name.includes("Instant") ||
            item.name.includes("Lucky") ||
            item.name.includes("Bingo") ||
            item.name.includes("Money") ||
            item.name.includes("Wheel") ||
            item.name.includes("Cashingo") ||
            item.name.includes("Diamond") ||
            item.name.includes("Cash For Life") ||
            item.name.includes("Extreme")
        )
        .reduce((itemSum, item) => itemSum + item.price * item.quantity, 0);
      return sum + instantAmount;
    }, 0);

    const drawTotal = currentTotal - instantTotal;

    console.log(`\n💰 Product Breakdown:`);
    console.log(
      `Instant Tickets: $${instantTotal.toFixed(2)} (${(
        (instantTotal / currentTotal) *
        100
      ).toFixed(1)}%)`
    );
    console.log(
      `Draw Games: $${drawTotal.toFixed(2)} (${(
        (drawTotal / currentTotal) *
        100
      ).toFixed(1)}%)`
    );

    // Payment method breakdown
    const cashTransactions = transactions.filter(
      (t) => t.transactionType === "cash"
    ).length;
    const cardTransactions = transactions.filter(
      (t) => t.transactionType === "card"
    ).length;
    const cashTotal = transactions
      .filter((t) => t.transactionType === "cash")
      .reduce((sum, t) => sum + t.total, 0);
    const cardTotal = transactions
      .filter((t) => t.transactionType === "card")
      .reduce((sum, t) => sum + t.total, 0);

    console.log(`\n💳 Payment Methods:`);
    console.log(
      `Cash: ${cashTransactions} transactions ($${cashTotal.toFixed(2)}) - ${(
        (cashTotal / currentTotal) *
        100
      ).toFixed(1)}%`
    );
    console.log(
      `Card: ${cardTransactions} transactions ($${cardTotal.toFixed(2)}) - ${(
        (cardTotal / currentTotal) *
        100
      ).toFixed(1)}%`
    );

    // Insert into database
    if (transactions.length > 0) {
      console.log(
        `\n💾 Inserting ${transactions.length} OLG transactions into database...`
      );
      const result = await collection.insertMany(transactions);
      console.log(
        `✅ Successfully inserted ${result.insertedCount} OLG transactions`
      );

      console.log(`\n🎰 OLG Sales Generation Complete!`);
      console.log(`📅 October 2025 OLG Revenue: $${currentTotal.toFixed(2)}`);
      console.log(
        `🎫 All transactions categorized as "Lotto" for proper filtering`
      );
    } else {
      console.log("❌ No transactions generated");
    }
  } catch (error) {
    console.error("❌ Error generating OLG sales:", error);
  } finally {
    await client.close();
    console.log("🔒 Database connection closed");
  }
}

// Run the script
generateOLGSalesOctober();
