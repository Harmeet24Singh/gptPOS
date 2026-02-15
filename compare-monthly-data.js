const { MongoClient } = require("mongodb");
require("dotenv").config();

async function compareMonthlyDataStructure() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
  const dbName = process.env.MONGO_DB || "convenience_store";

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  console.log("📊 Comparing Monthly Data Structure\n");

  // Get sample transactions from October (existing data)
  console.log("🍂 October 2025 Sample Structure:");
  const octSample = await db.collection("transactions").findOne({
    timestamp: { $gte: new Date("2025-10-01"), $lt: new Date("2025-11-01") },
  });

  if (octSample) {
    console.log("   Timestamp type:", typeof octSample.timestamp);
    console.log("   Timestamp value:", octSample.timestamp);
    console.log("   Fields:", Object.keys(octSample));
    console.log("   Sample item structure:", octSample.items[0]);
    console.log("   Payment structure:", octSample.paymentBreakdown?.[0]);
    console.log("   Transaction type:", octSample.transactionType);
    console.log("   Cashier:", octSample.cashier);
  }

  // Get sample from November (Date object timestamps)
  console.log("\n🍁 November 2025 Sample Structure:");
  const novSample = await db.collection("transactions").findOne({
    timestamp: { $gte: new Date("2025-11-01"), $lt: new Date("2025-12-01") },
  });

  if (novSample) {
    console.log("   Timestamp type:", typeof novSample.timestamp);
    console.log("   Timestamp value:", novSample.timestamp);
    console.log("   Fields:", Object.keys(novSample));
    console.log("   Sample item structure:", novSample.items[0]);
    console.log("   Payment structure:", novSample.paymentBreakdown?.[0]);
    console.log("   Transaction type:", novSample.transactionType);
    console.log("   Cashier:", novSample.cashier);
  }

  // Get sample from December (our new string timestamps)
  console.log("\n❄️  December 2025 Sample Structure:");
  const decSample = await db.collection("transactions").findOne({
    timestamp: {
      $gte: "2025-12-01T00:00:00.000Z",
      $lt: "2026-01-01T00:00:00.000Z",
    },
  });

  if (decSample) {
    console.log("   Timestamp type:", typeof decSample.timestamp);
    console.log("   Timestamp value:", decSample.timestamp);
    console.log("   Fields:", Object.keys(decSample));
    console.log("   Sample item structure:", decSample.items[0]);
    console.log("   Payment structure:", decSample.paymentBreakdown?.[0]);
    console.log("   Transaction type:", decSample.transactionType);
    console.log("   Cashier:", decSample.cashier);
  }

  // Compare counts and totals
  console.log("\n📈 Monthly Statistics Comparison:");

  const months = [
    {
      name: "October",
      query: {
        timestamp: {
          $gte: new Date("2025-10-01"),
          $lt: new Date("2025-11-01"),
        },
      },
    },
    {
      name: "November",
      query: {
        timestamp: {
          $gte: new Date("2025-11-01"),
          $lt: new Date("2025-12-01"),
        },
      },
    },
    {
      name: "December",
      query: {
        $or: [
          {
            timestamp: {
              $gte: "2025-12-01T00:00:00.000Z",
              $lt: "2026-01-01T00:00:00.000Z",
            },
          },
          {
            timestamp: {
              $gte: new Date("2025-12-01"),
              $lt: new Date("2026-01-01"),
            },
          },
        ],
      },
    },
  ];

  for (const month of months) {
    const transactions = await db
      .collection("transactions")
      .find(month.query)
      .toArray();

    if (transactions.length > 0) {
      const totalSales = transactions.reduce(
        (sum, t) => sum + (t.total || 0),
        0,
      );
      const avgTransaction = totalSales / transactions.length;

      const cashCount = transactions.filter(
        (t) => t.transactionType === "cash",
      ).length;
      const cardCount = transactions.filter(
        (t) => t.transactionType === "card",
      ).length;

      console.log(`\n   ${month.name}:`);
      console.log(`     Transactions: ${transactions.length}`);
      console.log(`     Total Sales: $${totalSales.toFixed(2)}`);
      console.log(`     Avg Transaction: $${avgTransaction.toFixed(2)}`);
      console.log(
        `     Cash: ${cashCount} (${((cashCount / transactions.length) * 100).toFixed(1)}%)`,
      );
      console.log(
        `     Card: ${cardCount} (${((cardCount / transactions.length) * 100).toFixed(1)}%)`,
      );

      // Check categories
      const categories = {};
      transactions.forEach((t) => {
        if (t.items) {
          t.items.forEach((item) => {
            const cat = item.category || "Unknown";
            categories[cat] = (categories[cat] || 0) + 1;
          });
        }
      });
      console.log(`     Categories: ${Object.keys(categories).join(", ")}`);
    }
  }

  await client.close();
}

compareMonthlyDataStructure().catch(console.error);
