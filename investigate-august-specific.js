const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function investigateSpecificAugustTransactions() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    console.log(
      "\n🔍 Investigating specific August transactions with potential issues..."
    );

    // Get those specific transactions
    const problemTransactions = await collection
      .find({
        transactionId: { $in: [80823, 80833, 80834] },
      })
      .toArray();

    console.log(`📊 Found ${problemTransactions.length} problem transactions`);

    problemTransactions.forEach((transaction, index) => {
      console.log(
        `\n${index + 1}. Transaction ID: ${transaction.transactionId}`
      );
      console.log(`   Payment Method: ${transaction.paymentMethod}`);
      console.log(`   Total: $${transaction.total}`);
      console.log(`   Subtotal: $${transaction.subtotal || "N/A"}`);
      console.log(`   Tax: $${transaction.tax || "N/A"}`);
      console.log(
        `   Date: ${new Date(transaction.timestamp).toLocaleDateString()}`
      );

      // Check all properties
      console.log(`   All properties:`);
      Object.keys(transaction).forEach((key) => {
        if (!["_id", "items"].includes(key)) {
          console.log(`     ${key}: ${transaction[key]}`);
        }
      });

      console.log(`   Items (${transaction.items.length}):`);
      transaction.items.forEach((item, idx) => {
        console.log(
          `     ${idx + 1}. ${item.name} (${item.category}) - $${
            item.price
          } x ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}`
        );
      });

      // Check if this transaction has grocery items
      const groceryItems = transaction.items.filter(
        (item) => item.category === "Grocery"
      );
      console.log(
        `   Grocery items: ${groceryItems.length}/${transaction.items.length}`
      );
    });

    // Now let's check if these transactions appear in any unpaid queries
    console.log(
      `\n🔍 Checking if these transactions would appear in credit/unpaid queries...`
    );

    const creditQuery1 = await collection
      .find({
        transactionId: { $in: [80823, 80833, 80834] },
        isCreditSale: true,
      })
      .toArray();

    const creditQuery2 = await collection
      .find({
        transactionId: { $in: [80823, 80833, 80834] },
        creditStatus: "unpaid",
      })
      .toArray();

    const creditQuery3 = await collection
      .find({
        transactionId: { $in: [80823, 80833, 80834] },
        $or: [
          { isCreditSale: true },
          { creditStatus: { $exists: true } },
          { isPartialPayment: true },
          { creditBalance: { $gt: 0 } },
        ],
      })
      .toArray();

    console.log(`   isCreditSale: true → ${creditQuery1.length} results`);
    console.log(`   creditStatus: "unpaid" → ${creditQuery2.length} results`);
    console.log(`   Any credit properties → ${creditQuery3.length} results`);

    if (creditQuery3.length > 0) {
      console.log(`\n⚠️  These transactions have credit properties:`);
      creditQuery3.forEach((t) => {
        console.log(`   ID ${t.transactionId}:`);
        if (t.isCreditSale)
          console.log(`     - isCreditSale: ${t.isCreditSale}`);
        if (t.creditStatus)
          console.log(`     - creditStatus: ${t.creditStatus}`);
        if (t.isPartialPayment)
          console.log(`     - isPartialPayment: ${t.isPartialPayment}`);
        if (t.creditBalance)
          console.log(`     - creditBalance: ${t.creditBalance}`);
      });
    }
  } catch (error) {
    console.error("Error investigating specific transactions:", error);
  } finally {
    await client.close();
  }
}

investigateSpecificAugustTransactions();
