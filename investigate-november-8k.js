const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function investigateNovemberTotals() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    console.log("=== NOVEMBER FOOD + GROCERY ANALYSIS ===");

    // Check both Food and Grocery categories in November
    const novemberFoodGrocery = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
        $or: [{ "items.category": "Food" }, { "items.category": "Grocery" }],
      })
      .toArray();

    console.log(
      `November Food + Grocery transactions: ${novemberFoodGrocery.length}`
    );

    let totalFoodGrocery = 0;
    let foodTotal = 0;
    let groceryTotal = 0;
    let foodCount = 0;
    let groceryCount = 0;

    novemberFoodGrocery.forEach((transaction) => {
      let hasFood =
        transaction.items &&
        transaction.items.some((item) => item.category === "Food");
      let hasGrocery =
        transaction.items &&
        transaction.items.some((item) => item.category === "Grocery");

      if (hasFood) {
        foodCount++;
        foodTotal += transaction.total;
      }
      if (hasGrocery) {
        groceryCount++;
        groceryTotal += transaction.total;
      }

      totalFoodGrocery += transaction.total;
    });

    console.log(
      `November Food: ${foodCount} transactions, $${foodTotal.toFixed(2)}`
    );
    console.log(
      `November Grocery: ${groceryCount} transactions, $${groceryTotal.toFixed(
        2
      )}`
    );
    console.log(`Combined Food + Grocery: $${totalFoodGrocery.toFixed(2)}`);

    // Show some Food transactions in November
    const foodTransactions = novemberFoodGrocery.filter(
      (t) => t.items && t.items.some((item) => item.category === "Food")
    );

    console.log("\nFirst 10 November Food transactions:");
    foodTransactions.slice(0, 10).forEach((t, i) => {
      const foodItems = t.items
        .filter((item) => item.category === "Food")
        .map((item) => item.name)
        .join(", ");
      console.log(
        `${i + 1}. ${t.timestamp.toISOString()} | $${
          t.total
        } | Items: ${foodItems}`
      );
    });

    // Check if there might be a script that generated November data
    console.log("\n=== NOVEMBER TRANSACTION ID ANALYSIS ===");

    const allNovemberTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
      })
      .sort({ transactionId: 1 })
      .toArray();

    const transactionIdRanges = {};
    allNovemberTransactions.forEach((t) => {
      if (t.transactionId) {
        const range = Math.floor(t.transactionId / 100000) * 100000;
        transactionIdRanges[range] = (transactionIdRanges[range] || 0) + 1;
      }
    });

    console.log("November transaction ID ranges:");
    Object.entries(transactionIdRanges).forEach(([range, count]) => {
      console.log(`${range}-${parseInt(range) + 99999}: ${count} transactions`);
    });

    // Check if there are transactions with IDs that suggest they were generated for November
    const highIdTransactions = allNovemberTransactions.filter(
      (t) => t.transactionId && t.transactionId >= 300000
    );

    if (highIdTransactions.length > 0) {
      console.log(
        `\nFound ${highIdTransactions.length} November transactions with IDs >= 300000:`
      );

      let highIdTotal = 0;
      const categoryTotals = {};

      highIdTransactions.forEach((t) => {
        highIdTotal += t.total;

        if (t.items) {
          t.items.forEach((item) => {
            const category = item.category || "Unknown";
            categoryTotals[category] = categoryTotals[category] || {
              count: 0,
              total: 0,
            };
            categoryTotals[category].count++;
            categoryTotals[category].total += t.total;
          });
        }
      });

      console.log(`High ID transactions total: $${highIdTotal.toFixed(2)}`);
      console.log("High ID transactions by category:");
      Object.entries(categoryTotals)
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([category, data]) => {
          console.log(
            `  ${category}: ${data.count} items, $${data.total.toFixed(2)}`
          );
        });

      // Show some examples
      console.log("\nFirst 5 high ID transactions:");
      highIdTransactions.slice(0, 5).forEach((t, i) => {
        const categories = t.items
          ? [...new Set(t.items.map((item) => item.category))].join(", ")
          : "No items";
        console.log(
          `${i + 1}. ID: ${t.transactionId} | ${t.timestamp.toISOString()} | $${
            t.total
          } | Categories: ${categories}`
        );
      });
    }

    // Finally, let's check if the $8025.96 might be a cumulative or different calculation
    console.log("\n=== POSSIBLE $8025.96 SOURCES ===");

    // Check if it's Food + Grocery combined
    const combinedTotal = foodTotal + groceryTotal;
    console.log(`Food + Grocery combined: $${combinedTotal.toFixed(2)}`);

    // Check if there's some other combination that gets close to $8025.96
    const novemberCategoryTotals = {};
    allNovemberTransactions.forEach((transaction) => {
      if (transaction.items && transaction.items.length > 0) {
        transaction.items.forEach((item) => {
          const category = item.category || "Unknown";
          novemberCategoryTotals[category] =
            (novemberCategoryTotals[category] || 0) + transaction.total;
        });
      }
    });

    console.log("\nNovember totals by category:");
    Object.entries(novemberCategoryTotals)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, total]) => {
        console.log(`${category}: $${total.toFixed(2)}`);
      });

    // Check if any combination gets close to $8025.96
    const targetAmount = 8025.96;
    const categories = Object.keys(novemberCategoryTotals);

    for (let i = 0; i < categories.length; i++) {
      for (let j = i + 1; j < categories.length; j++) {
        const combined =
          novemberCategoryTotals[categories[i]] +
          novemberCategoryTotals[categories[j]];
        if (Math.abs(combined - targetAmount) < 100) {
          console.log(
            `${categories[i]} + ${categories[j]} = $${combined.toFixed(
              2
            )} (close to target $${targetAmount})`
          );
        }
      }
    }
  } catch (error) {
    console.error("Error investigating November totals:", error);
  } finally {
    await client.close();
    console.log("\nConnection closed");
  }
}

// Run the investigation
investigateNovemberTotals();
