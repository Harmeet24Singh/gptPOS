const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function investigateJulyAlcoholSales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Get July transactions with alcohol items
    const julyTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
        "items.category": "Alcohol",
      })
      .toArray();

    console.log(`\n📊 July 2025 Transactions Analysis`);
    console.log(
      `Total transactions with alcohol items: ${julyTransactions.length}`
    );

    // Analyze each transaction to see what categories are present
    let pureAlcoholTransactions = 0;
    let mixedTransactions = 0;
    let totalAlcoholValue = 0;
    let totalNonAlcoholValue = 0;
    const categoriesFound = new Set();

    julyTransactions.forEach((transaction) => {
      let hasAlcohol = false;
      let hasNonAlcohol = false;
      let transactionAlcoholValue = 0;
      let transactionNonAlcoholValue = 0;

      transaction.items.forEach((item) => {
        categoriesFound.add(item.category);

        if (item.category === "Alcohol") {
          hasAlcohol = true;
          transactionAlcoholValue += item.total || item.price * item.quantity;
        } else {
          hasNonAlcohol = true;
          transactionNonAlcoholValue +=
            item.total || item.price * item.quantity;
        }
      });

      if (hasAlcohol && !hasNonAlcohol) {
        pureAlcoholTransactions++;
      } else if (hasAlcohol && hasNonAlcohol) {
        mixedTransactions++;
      }

      totalAlcoholValue += transactionAlcoholValue;
      totalNonAlcoholValue += transactionNonAlcoholValue;
    });

    console.log(`\n📋 Transaction Breakdown:`);
    console.log(`Pure alcohol transactions: ${pureAlcoholTransactions}`);
    console.log(`Mixed transactions (alcohol + other): ${mixedTransactions}`);

    console.log(`\n💰 Sales Breakdown:`);
    console.log(`Total alcohol value: $${totalAlcoholValue.toFixed(2)}`);
    console.log(`Total non-alcohol value: $${totalNonAlcoholValue.toFixed(2)}`);
    console.log(
      `Combined total: $${(totalAlcoholValue + totalNonAlcoholValue).toFixed(
        2
      )}`
    );

    console.log(`\n📦 Categories found in July transactions:`);
    Array.from(categoriesFound)
      .sort()
      .forEach((category) => {
        console.log(`- ${category}`);
      });

    // Show some sample mixed transactions
    if (mixedTransactions > 0) {
      console.log(`\n🔍 Sample mixed transactions (first 3):`);
      let count = 0;
      for (const transaction of julyTransactions) {
        if (count >= 3) break;

        const categories = [
          ...new Set(transaction.items.map((item) => item.category)),
        ];
        if (categories.length > 1) {
          console.log(`\nTransaction ID: ${transaction.transactionId}`);
          console.log(`Categories: ${categories.join(", ")}`);
          console.log(`Items:`);
          transaction.items.forEach((item) => {
            console.log(
              `  - ${item.name} (${item.category}): $${(
                item.total || item.price * item.quantity
              ).toFixed(2)}`
            );
          });
          count++;
        }
      }
    }
  } catch (error) {
    console.error("Error investigating July alcohol sales:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

// Run the script
investigateJulyAlcoholSales();
