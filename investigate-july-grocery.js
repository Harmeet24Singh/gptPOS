require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function investigateJulyGroceryDiscrepancy() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("convenience_store");
    const collection = db.collection("transactions");

    console.log("🔍 Investigating July Grocery Sales Discrepancy\n");

    // Check different ways July grocery data might be filtered

    // 1. By transaction ID pattern (70xxx)
    const byTransactionId = await collection
      .aggregate([
        {
          $match: {
            transactionId: { $regex: "^70" },
            "items.category": "Grocery",
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$total" },
            totalTransactions: { $sum: 1 },
          },
        },
      ])
      .toArray();

    console.log("📊 By Transaction ID Pattern (70xxx):");
    if (byTransactionId.length > 0) {
      console.log(
        `Total: $${byTransactionId[0].totalSales.toFixed(2)}, Transactions: ${
          byTransactionId[0].totalTransactions
        }`
      );
    } else {
      console.log("No results found");
    }

    // 2. By timestamp range
    const byTimestamp = await collection
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date("2025-07-01T00:00:00Z"),
              $lt: new Date("2025-08-01T00:00:00Z"),
            },
            "items.category": "Grocery",
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$total" },
            totalTransactions: { $sum: 1 },
          },
        },
      ])
      .toArray();

    console.log("\n📊 By Timestamp Range (July 2025):");
    if (byTimestamp.length > 0) {
      console.log(
        `Total: $${byTimestamp[0].totalSales.toFixed(2)}, Transactions: ${
          byTimestamp[0].totalTransactions
        }`
      );
    } else {
      console.log("No results found");
    }

    // 3. Check if there are multiple grocery categories
    const distinctCategories = await collection.distinct("items.category", {
      timestamp: {
        $gte: new Date("2025-07-01T00:00:00Z"),
        $lt: new Date("2025-08-01T00:00:00Z"),
      },
    });

    console.log(
      `\n🏷️ Distinct item categories in July 2025: ${distinctCategories.join(
        ", "
      )}`
    );

    // 4. Check if transactions have category field at transaction level
    const withTransactionCategory = await collection
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date("2025-07-01T00:00:00Z"),
              $lt: new Date("2025-08-01T00:00:00Z"),
            },
            category: "grocery", // lowercase
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$total" },
            totalTransactions: { $sum: 1 },
          },
        },
      ])
      .toArray();

    console.log("\n📊 By Transaction Category Field (lowercase):");
    if (withTransactionCategory.length > 0) {
      console.log(
        `Total: $${withTransactionCategory[0].totalSales.toFixed(
          2
        )}, Transactions: ${withTransactionCategory[0].totalTransactions}`
      );
    } else {
      console.log("No results found");
    }

    // 5. Check what the frontend filtering might be using
    const frontendStyle = await collection
      .aggregate([
        {
          $match: {
            $expr: {
              $and: [
                {
                  $gte: [
                    {
                      $dateFromString: {
                        dateString: {
                          $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$timestamp",
                          },
                        },
                      },
                    },
                    new Date("2025-07-01"),
                  ],
                },
                {
                  $lt: [
                    {
                      $dateFromString: {
                        dateString: {
                          $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$timestamp",
                          },
                        },
                      },
                    },
                    new Date("2025-08-01"),
                  ],
                },
              ],
            },
            "items.category": "Grocery",
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$total" },
            totalTransactions: { $sum: 1 },
          },
        },
      ])
      .toArray();

    console.log("\n📊 Frontend-style Date Filtering:");
    if (frontendStyle.length > 0) {
      console.log(
        `Total: $${frontendStyle[0].totalSales.toFixed(2)}, Transactions: ${
          frontendStyle[0].totalTransactions
        }`
      );
    } else {
      console.log("No results found");
    }

    // 6. Sample transactions to check structure
    const sampleTransactions = await collection
      .find({
        timestamp: {
          $gte: new Date("2025-07-01T00:00:00Z"),
          $lt: new Date("2025-08-01T00:00:00Z"),
        },
        "items.category": "Grocery",
      })
      .limit(5)
      .toArray();

    console.log("\n🔍 Sample July Grocery Transactions:");
    sampleTransactions.forEach((t) => {
      console.log(
        `- ${t.transactionId}: ${new Date(
          t.timestamp
        ).toDateString()}, Total: $${t.total}, Items: ${
          t.items.length
        }, Categories: ${[
          ...new Set(t.items.map((item) => item.category)),
        ].join(", ")}`
      );
    });

    // 7. Check for unpaid amounts
    const unpaidCheck = await collection
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date("2025-07-01T00:00:00Z"),
              $lt: new Date("2025-08-01T00:00:00Z"),
            },
            "items.category": "Grocery",
          },
        },
        {
          $group: {
            _id: null,
            totalUnpaid: { $sum: "$unpaid" },
            totalWithUnpaid: {
              $sum: {
                $cond: [{ $gt: ["$unpaid", 0] }, 1, 0],
              },
            },
          },
        },
      ])
      .toArray();

    if (unpaidCheck.length > 0) {
      console.log(
        `\n💰 Unpaid amounts: $${unpaidCheck[0].totalUnpaid.toFixed(
          2
        )} across ${unpaidCheck[0].totalWithUnpaid} transactions`
      );
    }

    // 8. Check if $6175.26 matches any specific calculation
    console.log("\n🎯 Looking for $6,175.26 match:");

    // Maybe it's subtotal without tax?
    const subtotalCheck = await collection
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date("2025-07-01T00:00:00Z"),
              $lt: new Date("2025-08-01T00:00:00Z"),
            },
            "items.category": "Grocery",
          },
        },
        {
          $group: {
            _id: null,
            totalSubtotal: { $sum: "$subtotal" },
          },
        },
      ])
      .toArray();

    if (subtotalCheck.length > 0) {
      console.log(
        `Subtotal (before tax): $${subtotalCheck[0].totalSubtotal.toFixed(2)}`
      );
      if (Math.abs(subtotalCheck[0].totalSubtotal - 6175.26) < 1) {
        console.log(
          "🎯 MATCH FOUND: Frontend might be showing subtotal instead of total!"
        );
      }
    }
  } catch (error) {
    console.error("❌ Investigation error:", error);
  } finally {
    await client.close();
    console.log("\n🔌 Connection closed");
  }
}

investigateJulyGroceryDiscrepancy();
