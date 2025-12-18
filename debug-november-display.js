const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function findNovemberDisplayDiscrepancy() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    console.log("=== FINDING SOURCE OF $11,765.74 NOVEMBER DISPLAY ===");

    // Test different query patterns that the frontend might be using

    // 1. Pure Grocery category
    console.log("1. Pure Grocery category query:");
    const groceryOnly = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
        "items.category": "Grocery",
      })
      .toArray();

    let groceryTotal = 0;
    groceryOnly.forEach((t) => (groceryTotal += t.total));
    console.log(
      `   ${groceryOnly.length} transactions, $${groceryTotal.toFixed(2)}`
    );

    // 2. Food category (which might be grouped with Grocery)
    console.log("2. Food category query:");
    const foodOnly = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
        "items.category": "Food",
      })
      .toArray();

    let foodTotal = 0;
    foodOnly.forEach((t) => (foodTotal += t.total));
    console.log(`   ${foodOnly.length} transactions, $${foodTotal.toFixed(2)}`);

    // 3. Combined Food + Grocery (frontend might group these)
    const combinedFoodGrocery = groceryTotal + foodTotal;
    console.log(
      `3. Combined Food + Grocery: $${combinedFoodGrocery.toFixed(2)}`
    );

    // 4. Check for multiple grocery-like categories
    const groceryLikeCategories = [
      "Grocery",
      "Food",
      "Beverages",
      "Snacks",
      "Bakery",
      "Candy",
      "Dairy",
      "Fresh Produce",
    ];

    console.log("4. All grocery-like categories:");
    let totalGroceryLike = 0;

    for (const category of groceryLikeCategories) {
      const categoryTransactions = await collection
        .find({
          timestamp: {
            $gte: new Date("2025-11-01T00:00:00.000Z"),
            $lt: new Date("2025-12-01T00:00:00.000Z"),
          },
          "items.category": category,
        })
        .toArray();

      let categoryTotal = 0;
      categoryTransactions.forEach((t) => (categoryTotal += t.total));
      totalGroceryLike += categoryTotal;

      if (categoryTotal > 0) {
        console.log(
          `   ${category}: ${
            categoryTransactions.length
          } transactions, $${categoryTotal.toFixed(2)}`
        );
      }
    }

    console.log(`   Total grocery-like: $${totalGroceryLike.toFixed(2)}`);

    // 5. Check if there's a different date range being used
    console.log("5. Different date ranges:");

    // Maybe timezone-adjusted November
    const novStartLocal = new Date("2025-11-01T05:00:00.000Z"); // EST offset
    const decStartLocal = new Date("2025-12-01T05:00:00.000Z");

    const localGrocery = await collection
      .find({
        timestamp: {
          $gte: novStartLocal,
          $lt: decStartLocal,
        },
        "items.category": "Grocery",
      })
      .toArray();

    let localGroceryTotal = 0;
    localGrocery.forEach((t) => (localGroceryTotal += t.total));
    console.log(
      `   Timezone-adjusted Grocery: ${
        localGrocery.length
      } transactions, $${localGroceryTotal.toFixed(2)}`
    );

    // 6. Check for transactions that might have multiple categories per item
    console.log("6. Looking for the exact $11,765.74 amount:");

    // Get all November transactions and look for combinations
    const allNovemberTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
      })
      .toArray();

    // Calculate totals by different combinations
    const categoryTotals = {};
    allNovemberTransactions.forEach((transaction) => {
      if (transaction.items && transaction.items.length > 0) {
        transaction.items.forEach((item) => {
          const category = item.category || "Unknown";
          categoryTotals[category] =
            (categoryTotals[category] || 0) + transaction.total;
        });
      }
    });

    console.log("   All November categories:");
    Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, total]) => {
        console.log(`      ${cat}: $${total.toFixed(2)}`);
      });

    // Look for combinations that equal 11765.74
    const targetAmount = 11765.74;
    const categories = Object.keys(categoryTotals);

    console.log(`\n7. Searching for combinations that equal $${targetAmount}:`);

    // Check various combinations
    for (let i = 0; i < categories.length; i++) {
      for (let j = i + 1; j < categories.length; j++) {
        const combined =
          categoryTotals[categories[i]] + categoryTotals[categories[j]];
        if (Math.abs(combined - targetAmount) < 10) {
          console.log(
            `   ${categories[i]} + ${categories[j]} = $${combined.toFixed(
              2
            )} *** CLOSE MATCH! ***`
          );
        }
      }
    }

    // Check 3-category combinations
    for (let i = 0; i < categories.length && i < 5; i++) {
      for (let j = i + 1; j < categories.length && j < 6; j++) {
        for (let k = j + 1; k < categories.length && k < 7; k++) {
          const combined =
            categoryTotals[categories[i]] +
            categoryTotals[categories[j]] +
            categoryTotals[categories[k]];
          if (Math.abs(combined - targetAmount) < 10) {
            console.log(
              `   ${categories[i]} + ${categories[j]} + ${
                categories[k]
              } = $${combined.toFixed(2)} *** CLOSE MATCH! ***`
            );
          }
        }
      }
    }

    // 8. Check if there might be duplicate counting
    console.log("\n8. Checking for potential duplicate counting:");

    // Items that appear in multiple categories
    const itemCategoryMap = {};
    allNovemberTransactions.forEach((transaction) => {
      if (transaction.items) {
        transaction.items.forEach((item) => {
          const itemName = item.name || "unnamed";
          if (!itemCategoryMap[itemName]) {
            itemCategoryMap[itemName] = new Set();
          }
          itemCategoryMap[itemName].add(item.category || "Unknown");
        });
      }
    });

    const multiCategoryItems = Object.entries(itemCategoryMap).filter(
      ([name, categories]) => categories.size > 1
    );

    if (multiCategoryItems.length > 0) {
      console.log("   Items appearing in multiple categories:");
      multiCategoryItems.slice(0, 10).forEach(([name, categories]) => {
        console.log(`      ${name}: ${Array.from(categories).join(", ")}`);
      });
    }
  } catch (error) {
    console.error("Error finding November display discrepancy:", error);
  } finally {
    await client.close();
    console.log("\nConnection closed");
  }
}

// Run the analysis
findNovemberDisplayDiscrepancy();
