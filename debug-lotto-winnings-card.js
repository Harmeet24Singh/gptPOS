const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function debugLottoWinningsCard() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const transactionCollection = db.collection("transactions");

    console.log("\n🔍 Debugging Lotto Winnings Card Issue...");

    // Get July transactions with "Lotto Winnings" items
    const lottoWinningsTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
        items: { $elemMatch: { name: "Lotto Winnings" } },
      })
      .toArray();

    console.log(
      `📊 Found ${lottoWinningsTransactions.length} transactions with "Lotto Winnings" items`
    );

    if (lottoWinningsTransactions.length > 0) {
      let totalWinnings = 0;
      let totalQuantity = 0;

      console.log(`\n🎰 Sample Lotto Winnings Transactions:`);
      lottoWinningsTransactions.slice(0, 5).forEach((transaction, index) => {
        console.log(
          `   ${index + 1}. ID: ${
            transaction.transactionId
          }, Total: $${transaction.total.toFixed(2)}`
        );
        transaction.items.forEach((item) => {
          if (item.name === "Lotto Winnings") {
            console.log(
              `      - Item: ${item.name}, Price: $${item.price}, Quantity: ${item.quantity}, Item Total: $${item.total}`
            );
            totalWinnings += Math.abs(item.total);
            totalQuantity += item.quantity;
          }
        });
      });

      console.log(`\n📈 Lotto Winnings Summary (from sample):`);
      console.log(`   Total Winnings Amount: $${totalWinnings.toFixed(2)}`);
      console.log(`   Total Quantity: ${totalQuantity}`);

      // Calculate total for all winnings
      let allWinnings = 0;
      let allQuantity = 0;

      lottoWinningsTransactions.forEach((transaction) => {
        transaction.items.forEach((item) => {
          if (item.name === "Lotto Winnings") {
            allWinnings += Math.abs(item.total);
            allQuantity += item.quantity;
          }
        });
      });

      console.log(`\n💰 All Lotto Winnings Totals:`);
      console.log(`   Total Winnings: $${allWinnings.toFixed(2)}`);
      console.log(`   Total Quantity: ${allQuantity}`);
      console.log(
        `   Average Winning: $${(allWinnings / allQuantity).toFixed(2)}`
      );
    }

    // Check how the frontend would calculate this using the same logic
    console.log(`\n🔧 Frontend Logic Simulation:`);
    console.log(`Simulating getTopSellingItems() logic...`);

    const itemStats = {};

    // Get all July transactions
    const allJulyTransactions = await transactionCollection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00.000Z"),
          $lt: new Date("2025-08-01T00:00:00.000Z"),
        },
      })
      .toArray();

    allJulyTransactions.forEach((transaction) => {
      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach((item) => {
          const itemKey = item.name;

          if (!itemStats[itemKey]) {
            itemStats[itemKey] = {
              name: item.name,
              category: item.category || "Uncategorized",
              quantitySold: 0,
              totalRevenue: 0,
              price: item.price,
            };
          }

          itemStats[itemKey].quantitySold += item.quantity;
          itemStats[itemKey].totalRevenue += item.price * item.quantity;
        });
      }
    });

    // Find Lotto Winnings in itemStats
    const lottoWinningsStats = itemStats["Lotto Winnings"];
    if (lottoWinningsStats) {
      console.log(`\n📊 Frontend ItemStats for "Lotto Winnings":`);
      console.log(`   Quantity Sold: ${lottoWinningsStats.quantitySold}`);
      console.log(
        `   Total Revenue: $${lottoWinningsStats.totalRevenue.toFixed(2)}`
      );
      console.log(`   Price: $${lottoWinningsStats.price}`);
      console.log(`   Category: ${lottoWinningsStats.category}`);

      console.log(`\n🔧 Frontend Card Logic:`);
      console.log(
        `   Math.abs(totalRevenue): $${Math.abs(
          lottoWinningsStats.totalRevenue
        ).toFixed(2)}`
      );
      console.log(`   This should show in the Lotto Winnings card`);
    } else {
      console.log(`\n❌ "Lotto Winnings" NOT found in itemStats!`);
      console.log(`Available items with "Lotto" or "winnings":`);
      Object.keys(itemStats).forEach((key) => {
        if (
          key.toLowerCase().includes("lotto") ||
          key.toLowerCase().includes("winning")
        ) {
          console.log(
            `   - "${key}": ${itemStats[key].quantitySold} sold, $${itemStats[
              key
            ].totalRevenue.toFixed(2)} revenue`
          );
        }
      });
    }

    // Show top selling items to see ranking
    const topItems = Object.values(itemStats)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 15);

    console.log(`\n🏆 Top 15 Items by Quantity (Frontend Logic):`);
    topItems.forEach((item, index) => {
      console.log(
        `   ${index + 1}. ${item.name}: ${
          item.quantitySold
        } sold, $${item.totalRevenue.toFixed(2)} revenue`
      );
    });
  } catch (error) {
    console.error("Error debugging lotto winnings card:", error);
  } finally {
    await client.close();
  }
}

debugLottoWinningsCard();
