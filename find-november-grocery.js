const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function findAllNovemberGrocery() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    console.log("=== COMPREHENSIVE NOVEMBER GROCERY SEARCH ===");

    // Search for ANY transaction that has grocery items and timestamp containing "2025-11"
    const allGroceryTransactions = await collection
      .find({
        "items.category": "Grocery",
      })
      .toArray();

    console.log(
      `Total grocery transactions in database: ${allGroceryTransactions.length}`
    );

    // Filter for November transactions with different methods
    const novemberGroceryByString = allGroceryTransactions.filter((t) =>
      t.timestamp.toISOString().startsWith("2025-11")
    );

    const novemberGroceryByMonth = allGroceryTransactions.filter((t) => {
      const date = new Date(t.timestamp);
      return date.getUTCFullYear() === 2025 && date.getUTCMonth() === 10; // November is month 10
    });

    console.log(
      `November grocery (string method): ${novemberGroceryByString.length} transactions`
    );
    console.log(
      `November grocery (month method): ${novemberGroceryByMonth.length} transactions`
    );

    if (novemberGroceryByMonth.length > 0) {
      let total = 0;
      novemberGroceryByMonth.forEach((t) => (total += t.total));
      console.log(`November grocery total: $${total.toFixed(2)}`);

      console.log("\nAll November grocery transactions:");
      novemberGroceryByMonth.forEach((t, i) => {
        console.log(
          `${i + 1}. ${t.timestamp.toISOString()} | $${t.total} | ID: ${
            t.transactionId
          } | Items: ${t.items
            .filter((item) => item.category === "Grocery")
            .map((item) => item.name)
            .join(", ")}`
        );
      });
    }

    // Also check if there might be transactions with different category names
    console.log("\n=== CHECKING FOR CATEGORY VARIATIONS ===");
    const allCategories = new Set();
    const allTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
      })
      .toArray();

    allTransactions.forEach((t) => {
      if (t.items && t.items.length > 0) {
        t.items.forEach((item) => {
          if (item.category) {
            allCategories.add(item.category);
          }
        });
      }
    });

    console.log(
      "All categories found in November:",
      Array.from(allCategories).sort()
    );

    // Check for case variations of grocery
    const groceryVariations = Array.from(allCategories).filter(
      (cat) =>
        cat.toLowerCase().includes("grocery") ||
        cat.toLowerCase().includes("groceries") ||
        cat.toLowerCase().includes("food") ||
        cat.toLowerCase().includes("produce")
    );

    console.log("Grocery-related categories:", groceryVariations);

    // Let's also manually check the frontend's likely query pattern
    console.log("\n=== FRONTEND-STYLE QUERY TEST ===");

    // This mimics how a frontend might query for November
    const frontendQuery = {
      $expr: {
        $and: [
          { $eq: [{ $year: "$timestamp" }, 2025] },
          { $eq: [{ $month: "$timestamp" }, 11] }, // November
        ],
      },
      "items.category": "Grocery",
    };

    const frontendResults = await collection.find(frontendQuery).toArray();
    console.log(
      `Frontend-style query results: ${frontendResults.length} transactions`
    );

    if (frontendResults.length > 0) {
      let frontendTotal = 0;
      frontendResults.forEach((t) => (frontendTotal += t.total));
      console.log(`Frontend-style query total: $${frontendTotal.toFixed(2)}`);
    }
  } catch (error) {
    console.error("Error finding November grocery:", error);
  } finally {
    await client.close();
    console.log("\nConnection closed");
  }
}

// Run the comprehensive search
findAllNovemberGrocery();
