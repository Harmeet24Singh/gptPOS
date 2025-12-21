const mongo = require("./server/mongo");

// Available lottery ticket names from database
const lotteryTickets = [
  { name: "Instant Crossword", price: 5 },
  { name: "Instant Noodles", price: 2 },
  { name: "Lotto 649", price: 3 },
  { name: "Lotto Max", price: 5 },
  { name: "Scratch Ticket $1", price: 1 },
  { name: "Scratch Ticket $2", price: 2 },
  { name: "Scratch Ticket $5", price: 5 },
  { name: "Scratch Ticket $10", price: 10 },
];

// Target: ~$25,800 in lottery sales for September 2025
const TARGET_AMOUNT = 25800;

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomPaymentMethod() {
  return Math.random() < 0.6 ? "cash" : "card"; // 60% cash, 40% card
}

function getRandomDate() {
  // September 2025: Sept 1-30
  const start = new Date("2025-09-01T06:00:00.000Z");
  const end = new Date("2025-09-30T22:00:00.000Z");
  const randomTime =
    start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime);
}

function generateLotteryTransaction() {
  const paymentMethod = getRandomPaymentMethod();
  const numItems = getRandomInt(1, 4); // 1-4 lottery items per transaction
  const items = [];
  let total = 0;

  for (let i = 0; i < numItems; i++) {
    const ticket =
      lotteryTickets[Math.floor(Math.random() * lotteryTickets.length)];
    const quantity = getRandomInt(1, 3);
    const itemTotal = ticket.price * quantity;

    items.push({
      name: ticket.name,
      quantity: quantity,
      price: ticket.price,
      total: itemTotal,
      category: "Lottery",
    });

    total += itemTotal;
  }

  const transaction = {
    timestamp: getRandomDate(),
    items: items,
    total: total,
    transactionType: paymentMethod,
    paymentMethod: paymentMethod,
    cashAmount: paymentMethod === "cash" ? total : 0,
    cardAmount: paymentMethod === "card" ? total : 0,
    paymentBreakdown:
      paymentMethod === "cash"
        ? { cash: total, card: 0 }
        : { cash: 0, card: total },
  };

  return transaction;
}

async function generateSeptemberLotterySales() {
  console.log("Connecting to database...");
  const db = await mongo.connect();

  console.log(
    `Generating lottery transactions for September 2025 targeting $${TARGET_AMOUNT}...`
  );

  const transactions = [];
  let currentTotal = 0;

  // Generate transactions until we reach target
  while (currentTotal < TARGET_AMOUNT) {
    const transaction = generateLotteryTransaction();

    // Don't exceed target by too much
    if (currentTotal + transaction.total > TARGET_AMOUNT + 500) {
      // Adjust the last transaction to get closer to target
      const remaining = TARGET_AMOUNT - currentTotal;
      if (remaining > 10) {
        // Create a smaller transaction to fill the gap
        const smallTicket =
          lotteryTickets.find((t) => t.price <= remaining) || lotteryTickets[0];
        const quantity = Math.max(1, Math.floor(remaining / smallTicket.price));
        const adjustedTotal = smallTicket.price * quantity;

        transaction.items = [
          {
            name: smallTicket.name,
            quantity: quantity,
            price: smallTicket.price,
            total: adjustedTotal,
            category: "Lottery",
          },
        ];
        transaction.total = adjustedTotal;
        transaction.cashAmount =
          transaction.paymentMethod === "cash" ? adjustedTotal : 0;
        transaction.cardAmount =
          transaction.paymentMethod === "card" ? adjustedTotal : 0;
        transaction.paymentBreakdown =
          transaction.paymentMethod === "cash"
            ? { cash: adjustedTotal, card: 0 }
            : { cash: 0, card: adjustedTotal };
      }
    }

    transactions.push(transaction);
    currentTotal += transaction.total;

    if (currentTotal >= TARGET_AMOUNT) break;
  }

  // Sort transactions by timestamp
  transactions.sort((a, b) => a.timestamp - b.timestamp);

  console.log(`Generated ${transactions.length} lottery transactions`);
  console.log(`Total amount: $${currentTotal.toFixed(2)}`);

  // Calculate payment breakdown
  const cashTotal = transactions
    .filter((t) => t.paymentMethod === "cash")
    .reduce((sum, t) => sum + t.total, 0);
  const cardTotal = transactions
    .filter((t) => t.paymentMethod === "card")
    .reduce((sum, t) => sum + t.total, 0);

  console.log(`Cash transactions: $${cashTotal.toFixed(2)}`);
  console.log(`Card transactions: $${cardTotal.toFixed(2)}`);

  // Insert into database
  console.log("Inserting transactions into database...");
  const result = await db.collection("transactions").insertMany(transactions);
  console.log(`Inserted ${result.insertedCount} transactions successfully!`);

  // Verify the inserted data
  const verification = await db
    .collection("transactions")
    .find({
      timestamp: {
        $gte: new Date("2025-09-01T00:00:00.000Z"),
        $lt: new Date("2025-10-01T00:00:00.000Z"),
      },
    })
    .toArray();

  const verifyTotal = verification.reduce((sum, tx) => sum + tx.total, 0);
  console.log(
    `\nVerification: ${
      verification.length
    } September transactions totaling $${verifyTotal.toFixed(2)}`
  );

  process.exit(0);
}

generateSeptemberLotterySales().catch(console.error);
