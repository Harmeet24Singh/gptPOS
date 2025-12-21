const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function checkAugustCreditTransactions() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    console.log(
      "\n🔍 Checking for August grocery transactions marked as credit sales..."
    );

    // Find all transactions with credit sale properties
    const creditTransactions = await collection
      .find({
        $or: [
          { isCreditSale: true },
          { creditStatus: { $exists: true } },
          { isPartialPayment: true },
          { creditBalance: { $gt: 0 } },
        ],
      })
      .toArray();

    console.log(
      `📊 Total credit transactions found: ${creditTransactions.length}`
    );

    if (creditTransactions.length > 0) {
      // Group by month
      const byMonth = creditTransactions.reduce((acc, transaction) => {
        const date = new Date(transaction.timestamp);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        if (!acc[monthYear]) acc[monthYear] = [];
        acc[monthYear].push(transaction);
        return acc;
      }, {});

      console.log("\n📅 Credit transactions by month:");
      Object.entries(byMonth).forEach(([monthYear, transactions]) => {
        const [month, year] = monthYear.split("/");
        const monthName = new Date(year, month - 1, 1).toLocaleString(
          "default",
          { month: "long" }
        );

        console.log(
          `   ${monthName} ${year}: ${transactions.length} transactions`
        );

        // Check for grocery items in these credit transactions
        const groceryCredit = transactions.filter(
          (t) => t.items && t.items.some((item) => item.category === "Grocery")
        );

        if (groceryCredit.length > 0) {
          console.log(
            `     ⚠️  ${groceryCredit.length} grocery transactions marked as credit!`
          );

          // Show sample transaction details
          if (monthYear === "8/2025") {
            console.log("\n🔍 Sample August grocery credit transaction:");
            const sample = groceryCredit[0];
            console.log(`     Transaction ID: ${sample.transactionId}`);
            console.log(`     Credit Status: ${sample.creditStatus}`);
            console.log(`     Is Credit Sale: ${sample.isCreditSale}`);
            console.log(`     Credit Balance: ${sample.creditBalance}`);
            console.log(`     Total Amount: $${sample.total}`);
            console.log(
              `     Grocery Items: ${
                sample.items.filter((i) => i.category === "Grocery").length
              }`
            );
          }
        }
      });

      // Check specifically for August 2025 grocery transactions
      const augustGroceryCredits = creditTransactions.filter((t) => {
        const date = new Date(t.timestamp);
        return (
          date.getMonth() === 7 &&
          date.getFullYear() === 2025 &&
          t.items &&
          t.items.some((item) => item.category === "Grocery")
        );
      });

      if (augustGroceryCredits.length > 0) {
        console.log(
          `\n❌ Found ${augustGroceryCredits.length} August grocery transactions incorrectly marked as credit sales!`
        );

        const totalAugustGroceryCredit = augustGroceryCredits.reduce(
          (sum, t) => sum + t.total,
          0
        );
        console.log(
          `💰 Total August grocery credit amount: $${totalAugustGroceryCredit.toFixed(
            2
          )}`
        );

        console.log(
          "\n🔧 Do you want me to fix these transactions? (This will remove credit flags)"
        );
      }
    } else {
      console.log("✅ No credit transactions found - this is not the issue.");
    }

    // Also check for any August transactions with unusual payment status
    const augustTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-08-01T00:00:00.000Z"),
          $lt: new Date("2025-09-01T00:00:00.000Z"),
        },
      })
      .toArray();

    console.log(`\n📊 Total August transactions: ${augustTransactions.length}`);

    // Check payment method distribution
    const paymentMethods = augustTransactions.reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + 1;
      return acc;
    }, {});

    console.log("💳 August payment method distribution:");
    Object.entries(paymentMethods).forEach(([method, count]) => {
      console.log(`   ${method}: ${count} transactions`);
    });
  } catch (error) {
    console.error("Error checking credit transactions:", error);
  } finally {
    await client.close();
  }
}

checkAugustCreditTransactions();
