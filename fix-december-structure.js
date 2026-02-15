const { MongoClient } = require("mongodb");
require("dotenv").config();

async function fixDecemberDataStructure() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
  const dbName = process.env.MONGO_DB || "convenience_store";

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  console.log("🔧 Fixing December Data Structure...\n");

  // First, get the highest transactionId from existing data
  const lastTransaction = await db
    .collection("transactions")
    .findOne(
      { transactionId: { $exists: true } },
      { sort: { transactionId: -1 } },
    );

  let nextTransactionId = lastTransaction
    ? lastTransaction.transactionId + 1
    : 120000;
  console.log(`📊 Starting transactionId from: ${nextTransactionId}`);

  // Get December transactions that need fixing (string timestamps)
  const decemberTransactions = await db
    .collection("transactions")
    .find({
      timestamp: {
        $gte: "2025-12-01T00:00:00.000Z",
        $lt: "2026-01-01T00:00:00.000Z",
      },
    })
    .toArray();

  console.log(
    `🔍 Found ${decemberTransactions.length} December transactions to fix`,
  );

  // Remove all December transactions first
  await db.collection("transactions").deleteMany({
    timestamp: {
      $gte: "2025-12-01T00:00:00.000Z",
      $lt: "2026-01-01T00:00:00.000Z",
    },
  });

  console.log("🗑️  Removed old December transactions");

  // Recreate December transactions with proper structure
  const fixedTransactions = [];

  for (let i = 0; i < decemberTransactions.length; i++) {
    const oldTx = decemberTransactions[i];

    // Fix timestamp to Date object
    const timestamp = new Date(oldTx.timestamp);

    // Fix items structure
    const fixedItems = oldTx.items.map((item) => ({
      barcode:
        item.barcode ||
        `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
      category: item.category,
    }));

    // Calculate proper amounts
    const subtotal = fixedItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.13;
    const total = subtotal + tax;

    // Create proper transaction structure matching October/November
    const fixedTransaction = {
      transactionId: nextTransactionId++,
      timestamp: timestamp,
      items: fixedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      taxableAmount: Math.round(subtotal * 100) / 100,
      nonTaxableAmount: 0,
      paymentMethod: oldTx.paymentMethod,
      transactionType: oldTx.transactionType,
      cashier: "system", // Match October/November pattern
      store: "Main Store",
      paymentBreakdown: [
        {
          method: oldTx.paymentMethod,
          amount: Math.round(total * 100) / 100,
        },
      ],
      cashAmount:
        oldTx.paymentMethod === "cash" ? Math.round(total * 100) / 100 : 0,
      cardAmount:
        oldTx.paymentMethod === "card" ? Math.round(total * 100) / 100 : 0,
      creditAmount: 0,
      cashback: 0,
      change: 0,
    };

    fixedTransactions.push(fixedTransaction);
  }

  // Insert fixed transactions
  if (fixedTransactions.length > 0) {
    await db.collection("transactions").insertMany(fixedTransactions);
    console.log(
      `✅ Inserted ${fixedTransactions.length} fixed December transactions`,
    );

    // Verify the fix
    const sample = await db.collection("transactions").findOne({
      transactionId: { $gte: nextTransactionId - fixedTransactions.length },
    });

    console.log("\n📄 Sample fixed transaction:");
    console.log("   Timestamp type:", typeof sample.timestamp);
    console.log("   Has transactionId:", !!sample.transactionId);
    console.log("   Item structure:", sample.items[0]);
    console.log("   Cashier:", sample.cashier);
  }

  await client.close();
  console.log("\n🔒 Database connection closed");
}

fixDecemberDataStructure().catch(console.error);
