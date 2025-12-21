const { MongoClient } = require("mongodb");

const url =
  "mongodb+srv://harmeet24singh_db_user:rgVNeaq2SgztJDv4@cluster0.a2m0kky.mongodb.net";
const dbName = "convenience_store";

const lotteryTickets = [
  "Scratch Ticket $1",
  "Scratch Ticket $2",
  "Scratch Ticket $5",
  "Scratch Ticket $10",
  "Scratch Ticket $20",
  "Scratch Ticket $30",
  "Powerball",
  "Mega Millions",
  "Pick 3",
  "Pick 4",
  "Cash 5",
  "Lucky for Life",
  "Daily Derby",
  "SuperLotto Plus",
  "Fantasy 5",
  "Daily 3",
  "Daily 4",
  "Hot Spot",
  "Keno",
  "All or Nothing",
  "Texas Two Step",
  "Lotto Texas",
  "Cash4Life",
  "Numbers",
  "Win 4",
  "Take 5",
  "Quick Draw",
  "Instant Crossword",
  "Crossword",
  "Bingo",
  "Monopoly",
  "Blackjack",
  "Poker",
  "Tic Tac Toe",
  "Word Games",
  "Lucky 7s",
  "Triple 777",
  "Cash Blast",
  "Money Bags",
  "Diamond Dollars",
  "Gold Rush",
  "Silver Strike",
  "Ruby Red",
  "Emerald Green",
  "Sapphire Blue",
];

async function generateSeptemberLotteryTransactions() {
  const client = new MongoClient(url, { useUnifiedTopology: true });

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // First, delete any existing September transactions
    const deleteResult = await collection.deleteMany({
      timestamp: {
        $gte: new Date("2025-09-01T00:00:00.000Z"),
        $lt: new Date("2025-10-01T00:00:00.000Z"),
      },
    });
    console.log(
      `Deleted ${deleteResult.deletedCount} existing September transactions`
    );

    const transactions = [];
    let totalAmount = 0;
    let totalCardAmount = 0;
    const CARD_LIMIT = 15000; // $15k limit

    // Generate 1,279 transactions throughout September 2025
    for (let i = 0; i < 1279; i++) {
      // Random date in September 2025
      const startDate = new Date("2025-09-01T00:00:00.000Z");
      const endDate = new Date("2025-09-30T23:59:59.999Z");
      const randomTime = new Date(
        startDate.getTime() +
          Math.random() * (endDate.getTime() - startDate.getTime())
      );

      // Generate 1-4 lottery items per transaction
      const numItems = Math.floor(Math.random() * 4) + 1;
      const items = [];
      let transactionTotal = 0;

      for (let j = 0; j < numItems; j++) {
        const ticket =
          lotteryTickets[Math.floor(Math.random() * lotteryTickets.length)];
        let price;

        // Set realistic prices based on ticket type
        if (ticket.includes("$1")) price = 1;
        else if (ticket.includes("$2")) price = 2;
        else if (ticket.includes("$5")) price = 5;
        else if (ticket.includes("$10")) price = 10;
        else if (ticket.includes("$20")) price = 20;
        else if (ticket.includes("$30")) price = 30;
        else if (["Powerball", "Mega Millions"].includes(ticket)) price = 2;
        else if (["Pick 3", "Pick 4", "Daily 3", "Daily 4"].includes(ticket))
          price = 1;
        else if (["Cash 5", "Fantasy 5", "Take 5"].includes(ticket)) price = 1;
        else price = Math.floor(Math.random() * 5) + 1; // $1-$5 for other tickets

        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 of each ticket
        const itemTotal = price * quantity;
        transactionTotal += itemTotal;

        items.push({
          name: ticket,
          category: "Lotto instant",
          price: price,
          quantity: quantity,
          total: itemTotal,
        });
      }

      // Determine payment method - check card limit first
      let paymentMethod;
      if (totalCardAmount + transactionTotal > CARD_LIMIT) {
        // If adding this transaction would exceed card limit, use cash or credit
        paymentMethod = Math.random() < 0.8 ? "cash" : "credit";
      } else {
        // Normal payment distribution: 40% cash, 50% card, 10% credit
        const rand = Math.random();
        if (rand < 0.4) paymentMethod = "cash";
        else if (rand < 0.9) paymentMethod = "card";
        else paymentMethod = "credit";
      }

      // Create payment breakdown
      let paymentBreakdown = [];
      let cashAmount = 0,
        cardAmount = 0,
        creditAmount = 0;

      if (paymentMethod === "cash") {
        cashAmount = transactionTotal;
        paymentBreakdown.push({ method: "cash", amount: cashAmount });
      } else if (paymentMethod === "card") {
        cardAmount = transactionTotal;
        totalCardAmount += cardAmount;
        paymentBreakdown.push({ method: "card", amount: cardAmount });
      } else {
        creditAmount = transactionTotal;
        paymentBreakdown.push({ method: "credit", amount: creditAmount });
      }

      const transaction = {
        timestamp: randomTime,
        items: items,
        subtotal: transactionTotal,
        tax: 0, // Lottery tickets typically aren't taxed
        total: transactionTotal,
        finalTotal: transactionTotal,
        cashAmount: cashAmount,
        cardAmount: cardAmount,
        creditAmount: creditAmount,
        paymentBreakdown: paymentBreakdown,
        paymentMethod: paymentMethod,
        transactionType: paymentMethod,
        transactionId: `TXN${Date.now()}${i}`,
        cashier: "System",
      };

      transactions.push(transaction);
      totalAmount += transactionTotal;
    }

    // Insert all transactions
    const result = await collection.insertMany(transactions);

    console.log(
      `✅ Successfully created ${result.insertedCount} September 2025 lottery transactions`
    );
    console.log(`💰 Total lottery sales: $${totalAmount.toFixed(2)}`);
    console.log(
      `💳 Total card amount: $${totalCardAmount.toFixed(
        2
      )} (limit: $${CARD_LIMIT})`
    );
    console.log(`📅 Date range: September 1-30, 2025`);
    console.log(`🎫 All transactions have category: "Lotto instant"`);
  } catch (error) {
    console.error("❌ Error generating transactions:", error);
  } finally {
    await client.close();
  }
}

generateSeptemberLotteryTransactions();
