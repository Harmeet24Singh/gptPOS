const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function checkJulyAlcoholSales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Get July alcohol transactions
    const julyAlcoholTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
        "items.category": "Alcohol",
      })
      .toArray();

    console.log(`\n📊 July 2025 Alcohol Sales Analysis`);
    console.log(`Total transactions: ${julyAlcoholTransactions.length}`);

    // Calculate total sales
    const totalSales = julyAlcoholTransactions.reduce((sum, transaction) => {
      return sum + transaction.total;
    }, 0);

    console.log(`💰 Current total sales: $${totalSales.toFixed(2)}`);
    console.log(`🎯 Target sales: $13,650.00`);
    console.log(`📈 Difference: $${(13650 - totalSales).toFixed(2)}`);

    // Weekly breakdown
    const weeks = {};
    julyAlcoholTransactions.forEach((t) => {
      const week = Math.ceil(t.timestamp.getDate() / 7);
      weeks[week] = (weeks[week] || 0) + t.total;
    });

    console.log("\n📅 Weekly breakdown:");
    Object.keys(weeks).forEach((week) => {
      console.log(`Week ${week}: $${weeks[week].toFixed(2)}`);
    });

    // Daily breakdown for first few days
    const dailyTotals = {};
    julyAlcoholTransactions.forEach((t) => {
      const day = t.timestamp.getDate();
      dailyTotals[day] = (dailyTotals[day] || 0) + t.total;
    });

    console.log("\n📅 First 10 days breakdown:");
    for (let day = 1; day <= 10; day++) {
      if (dailyTotals[day]) {
        console.log(`July ${day}: $${dailyTotals[day].toFixed(2)}`);
      }
    }

    // If we need to add more sales
    if (totalSales < 13650) {
      const needed = 13650 - totalSales;
      console.log(
        `\n⚠️  Need to add approximately $${needed.toFixed(2)} more in sales`
      );
      console.log(
        `💡 Suggestion: Add ${Math.ceil(
          needed / 35
        )} more transactions (avg $35 each)`
      );
    } else if (totalSales > 13650) {
      const excess = totalSales - 13650;
      console.log(`\n✅ Target exceeded by $${excess.toFixed(2)}`);
    } else {
      console.log(`\n🎯 Perfect! Target reached exactly!`);
    }
  } catch (error) {
    console.error("Error checking July alcohol sales:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

// Run the script
checkJulyAlcoholSales();
