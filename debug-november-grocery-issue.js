const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function investigateNovemberGroceryIssue() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    console.log("=== INVESTIGATING NOVEMBER GROCERY $11,765.74 ISSUE ===");

    // Get all November grocery transactions
    const novemberGrocery = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-11-01T00:00:00.000Z"),
          $lt: new Date("2025-12-01T00:00:00.000Z"),
        },
        "items.category": "Grocery",
      })
      .toArray();

    let totalAmount = 0;
    novemberGrocery.forEach((t) => (totalAmount += t.total));

    console.log(
      `Total November grocery transactions: ${novemberGrocery.length}`
    );
    console.log(`Total November grocery amount: $${totalAmount.toFixed(2)}`);

    // Check for transaction ID ranges to identify different sources
    const transactionIdRanges = {};
    const itemAnalysis = {};
    let duplicateCount = 0;
    const seenTransactionIds = new Set();

    novemberGrocery.forEach((transaction) => {
      // Check for duplicates
      if (seenTransactionIds.has(transaction.transactionId)) {
        duplicateCount++;
      } else {
        seenTransactionIds.add(transaction.transactionId);
      }

      // Analyze transaction ID ranges
      if (transaction.transactionId) {
        const range = Math.floor(transaction.transactionId / 100000) * 100000;
        transactionIdRanges[range] = transactionIdRanges[range] || {
          count: 0,
          total: 0,
        };
        transactionIdRanges[range].count++;
        transactionIdRanges[range].total += transaction.total;
      }

      // Analyze items that were categorized as grocery
      if (transaction.items) {
        transaction.items.forEach((item) => {
          if (item.category === "Grocery") {
            const itemName = item.name || "unnamed";
            itemAnalysis[itemName] = itemAnalysis[itemName] || {
              count: 0,
              total: 0,
            };
            itemAnalysis[itemName].count++;
            itemAnalysis[itemName].total += transaction.total;
          }
        });
      }
    });

    console.log(`\nDuplicate transaction IDs found: ${duplicateCount}`);

    console.log("\nTransaction ID ranges:");
    Object.entries(transactionIdRanges).forEach(([range, data]) => {
      console.log(
        `${range}-${parseInt(range) + 99999}: ${
          data.count
        } transactions, $${data.total.toFixed(2)}`
      );
    });

    // Show top items by total amount to find problematic categorizations
    console.log(
      "\nTop grocery items by total transaction amount (potential miscategorizations):"
    );
    const sortedItems = Object.entries(itemAnalysis)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 20);

    sortedItems.forEach(([itemName, data]) => {
      console.log(
        `${itemName}: ${data.count} occurrences, $${data.total.toFixed(
          2
        )} total`
      );
    });

    // Look for items that shouldn't be grocery
    console.log("\n=== IDENTIFYING MISCATEGORIZED ITEMS ===");

    const nonGroceryPatterns = [
      /belmont|du maurier|marlboro|camel|newport|cigarette|tobacco/i,
      /scratch|lotto|lottery|649|max/i,
      /cashback|discount|fee/i,
      /gas|fuel|oil|automotive/i,
      /phone|card|prepaid/i,
    ];

    let miscategorizedTransactions = [];
    let miscategorizedAmount = 0;

    novemberGrocery.forEach((transaction) => {
      if (transaction.items) {
        let hasMiscategorized = false;

        transaction.items.forEach((item) => {
          if (item.category === "Grocery" && item.name) {
            const shouldNotBeGrocery = nonGroceryPatterns.some((pattern) =>
              pattern.test(item.name)
            );

            if (shouldNotBeGrocery) {
              hasMiscategorized = true;
            }
          }
        });

        if (hasMiscategorized) {
          miscategorizedTransactions.push(transaction);
          miscategorizedAmount += transaction.total;
        }
      }
    });

    console.log(
      `Found ${miscategorizedTransactions.length} transactions with miscategorized items`
    );
    console.log(`Miscategorized amount: $${miscategorizedAmount.toFixed(2)}`);

    if (miscategorizedTransactions.length > 0) {
      console.log("\nFirst 10 miscategorized transactions:");
      miscategorizedTransactions.slice(0, 10).forEach((t, i) => {
        const items = t.items
          .map((item) => `${item.name}(${item.category})`)
          .join(", ");
        console.log(
          `${i + 1}. ID: ${t.transactionId} | $${t.total} | Items: ${items}`
        );
      });
    }

    // Check for very high-value transactions that might be errors
    console.log("\n=== HIGH-VALUE TRANSACTIONS (POTENTIAL ERRORS) ===");
    const highValueTransactions = novemberGrocery.filter((t) => t.total > 50);

    let highValueTotal = 0;
    highValueTransactions.forEach((t) => (highValueTotal += t.total));

    console.log(
      `Transactions over $50: ${
        highValueTransactions.length
      }, Total: $${highValueTotal.toFixed(2)}`
    );

    if (highValueTransactions.length > 0) {
      console.log("High-value transactions:");
      highValueTransactions.slice(0, 10).forEach((t, i) => {
        const items = t.items
          ? t.items.map((item) => item.name).join(", ")
          : "no items";
        console.log(
          `${i + 1}. ID: ${t.transactionId} | $${t.total} | Items: ${items}`
        );
      });
    }

    // Calculate what the total should be without problematic transactions
    const validTotal = totalAmount - miscategorizedAmount - highValueTotal;
    console.log(
      `\nAdjusted total (excluding miscategorized and high-value): $${validTotal.toFixed(
        2
      )}`
    );

    // Recommend fixes
    console.log("\n=== RECOMMENDED FIXES ===");
    console.log("1. Fix miscategorized items (tobacco, lottery, etc.)");
    console.log("2. Review high-value transactions for accuracy");
    console.log("3. Remove duplicate transactions if any");
    console.log(
      `4. Target should be ~$5000, current valid amount is ~$${validTotal.toFixed(
        2
      )}`
    );
  } catch (error) {
    console.error("Error investigating November grocery issue:", error);
  } finally {
    await client.close();
    console.log("\nConnection closed");
  }
}

// Run the investigation
investigateNovemberGroceryIssue();
