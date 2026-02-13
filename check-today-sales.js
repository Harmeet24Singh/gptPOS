const { MongoClient } = require("mongodb");
require("dotenv").config();

const url = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function checkTodaysSales() {
  const client = new MongoClient(url);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log("🗓️ Checking transactions for:", today.toDateString());
    console.log(
      "📅 Date range:",
      today.toISOString(),
      "to",
      tomorrow.toISOString(),
    );

    // Find today's transactions
    const todaysTransactions = await collection
      .find({
        timestamp: {
          $gte: today.toISOString(),
          $lt: tomorrow.toISOString(),
        },
      })
      .toArray();

    console.log(`\n📊 Found ${todaysTransactions.length} transactions today:`);

    let totalSales = 0;

    todaysTransactions.forEach((transaction, index) => {
      const transactionTotal = transaction.total || 0;
      totalSales += transactionTotal;

      console.log(`\n${index + 1}. Transaction ID: ${transaction._id}`);
      console.log(`   💰 Total: $${transactionTotal.toFixed(2)}`);
      console.log(
        `   ⏰ Time: ${new Date(transaction.timestamp).toLocaleString()}`,
      );
      console.log(
        `   🛒 Items: ${transaction.items ? transaction.items.length : 0}`,
      );

      if (transaction.items && transaction.items.length > 0) {
        transaction.items.forEach((item, itemIndex) => {
          console.log(
            `      ${itemIndex + 1}. ${item.name} - Qty: ${item.quantity} x $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}`,
          );
        });
      }

      console.log(`   📝 Type: ${transaction.transactionType || "N/A"}`);
      console.log(`   💳 Payment: ${transaction.paymentMethod || "N/A"}`);
    });

    console.log(`\n💰 Total Sales Today: $${totalSales.toFixed(2)}`);
    console.log(`🎯 Expected: $110.96`);
    console.log(
      `✅ Match: ${totalSales.toFixed(2) === "110.96" ? "YES" : "NO"}`,
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

checkTodaysSales();
