const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function fixNovemberDuplicateCategories() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    console.log("=== FIXING NOVEMBER DUPLICATE CATEGORY ISSUE ===");

    // Get all November transactions
    const novemberTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
      })
      .toArray();

    console.log(
      `Processing ${novemberTransactions.length} November transactions...`
    );

    let fixedTransactions = 0;
    let totalFixed = 0;

    // Define proper category hierarchy (first match wins)
    const categoryRules = [
      {
        pattern:
          /belmont|du maurier|marlboro|camel|newport|cigarette|tobacco|vuse|juul/i,
        category: "Tobacco",
      },
      {
        pattern: /scratch|lotto|lottery|649|max|winnings/i,
        category: "Lottery",
      },
      { pattern: /cashback|discount|fee|redemption/i, category: "Other" },
      { pattern: /gas|fuel|oil|automotive|motor/i, category: "Automotive" },
      { pattern: /phone|card|prepaid/i, category: "Other" },
      {
        pattern:
          /toilet paper|paper towels|detergent|dish soap|cleaner|household/i,
        category: "Household",
      },
      {
        pattern: /shampoo|toothpaste|deodorant|personal care/i,
        category: "Personal Care",
      },
      {
        pattern:
          /coca cola|pepsi|sprite|coke|red bull|monster|energy|coffee|tea|juice|water|beverage/i,
        category: "Beverages",
      },
      {
        pattern:
          /chips|lays|doritos|cheetos|candy|chocolate|kit kat|snickers|reese|snack|crackers/i,
        category: "Snacks",
      },
      {
        pattern:
          /milk|bread|eggs|banana|apple|cheese|yogurt|butter|cereal|soup|pasta|rice|meat|chicken|beef|produce|frozen|grocery/i,
        category: "Grocery",
      },
    ];

    // Process each transaction
    for (const transaction of novemberTransactions) {
      if (transaction.items && transaction.items.length > 0) {
        let hasChanges = false;

        const updatedItems = transaction.items.map((item) => {
          if (!item.name) return item;

          // Find the correct category based on item name
          for (const rule of categoryRules) {
            if (rule.pattern.test(item.name)) {
              if (item.category !== rule.category) {
                hasChanges = true;
                return { ...item, category: rule.category };
              }
              break; // First match wins, don't check other rules
            }
          }

          return item;
        });

        // Update the transaction if changes were made
        if (hasChanges) {
          await collection.updateOne(
            { _id: transaction._id },
            { $set: { items: updatedItems } }
          );

          fixedTransactions++;
          totalFixed += transaction.total;

          if (fixedTransactions <= 10) {
            const oldCategories = transaction.items
              .map((item) => item.category)
              .join(", ");
            const newCategories = updatedItems
              .map((item) => item.category)
              .join(", ");
            console.log(
              `Fixed transaction ${transaction.transactionId}: ${oldCategories} -> ${newCategories}`
            );
          }
        }
      }
    }

    console.log(
      `\nFixed ${fixedTransactions} transactions with category issues`
    );
    console.log(
      `Total amount in fixed transactions: $${totalFixed.toFixed(2)}`
    );

    // Now verify the new grocery total
    console.log("\n=== VERIFICATION AFTER FIX ===");

    const finalGroceryTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
        "items.category": "Grocery",
      })
      .toArray();

    let finalGroceryTotal = 0;
    finalGroceryTransactions.forEach((t) => (finalGroceryTotal += t.total));

    console.log(
      `Final November grocery: ${
        finalGroceryTransactions.length
      } transactions, $${finalGroceryTotal.toFixed(2)}`
    );

    // If still too high, let's remove some transactions to get closer to $5000
    if (finalGroceryTotal > 6000) {
      console.log("\n=== REDUCING TO TARGET $5000 ===");

      // Sort transactions by amount (highest first) and remove some
      const sortedTransactions = finalGroceryTransactions.sort(
        (a, b) => b.total - a.total
      );

      let amountToRemove = finalGroceryTotal - 5000;
      let transactionsToRemove = [];
      let removedAmount = 0;

      for (const transaction of sortedTransactions) {
        if (
          removedAmount < amountToRemove &&
          transaction.transactionId >= 300000
        ) {
          // Only remove transactions we generated (ID >= 300000)
          transactionsToRemove.push(transaction);
          removedAmount += transaction.total;

          if (removedAmount >= amountToRemove) break;
        }
      }

      console.log(
        `Removing ${
          transactionsToRemove.length
        } transactions totaling $${removedAmount.toFixed(2)}`
      );

      // Remove the excess transactions
      for (const transaction of transactionsToRemove) {
        await collection.deleteOne({ _id: transaction._id });
      }

      // Final verification
      const veryFinalGrocery = await collection
        .find({
          timestamp: {
            $gte: new Date("2025-11-01T00:00:00.000Z"),
            $lt: new Date("2025-12-01T00:00:00.000Z"),
          },
          "items.category": "Grocery",
        })
        .toArray();

      let veryFinalTotal = 0;
      veryFinalGrocery.forEach((t) => (veryFinalTotal += t.total));

      console.log(
        `\nFINAL November grocery: ${
          veryFinalGrocery.length
        } transactions, $${veryFinalTotal.toFixed(2)}`
      );
    }

    // Show final category breakdown
    console.log("\n=== FINAL NOVEMBER CATEGORY BREAKDOWN ===");
    const finalCategories = {};
    const allFinalTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
      })
      .toArray();

    allFinalTransactions.forEach((transaction) => {
      if (transaction.items && transaction.items.length > 0) {
        transaction.items.forEach((item) => {
          const category = item.category || "Unknown";
          finalCategories[category] =
            (finalCategories[category] || 0) + transaction.total;
        });
      }
    });

    Object.entries(finalCategories)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, total]) => {
        console.log(`${cat}: $${total.toFixed(2)}`);
      });
  } catch (error) {
    console.error("Error fixing November duplicate categories:", error);
  } finally {
    await client.close();
    console.log("\nConnection closed");
  }
}

// Run the fix
fixNovemberDuplicateCategories();
