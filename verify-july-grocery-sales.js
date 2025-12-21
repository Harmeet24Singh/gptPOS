require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function verifyJulyGrocerySales() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("convenience_store");
    const collection = db.collection("transactions");

    console.log("🛒 July 2025 Grocery Sales Verification Report\n");
    console.log("=".repeat(50));

    // Main sales verification
    const salesVerification = await collection
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
            avgTransaction: { $avg: "$total" },
            totalTax: { $sum: "$tax" },
            totalSubtotal: { $sum: "$subtotal" },
            minTransaction: { $min: "$total" },
            maxTransaction: { $max: "$total" },
          },
        },
      ])
      .toArray();

    if (salesVerification.length > 0) {
      const stats = salesVerification[0];
      console.log("📊 SALES SUMMARY");
      console.log(`Total Sales: $${stats.totalSales.toFixed(2)}`);
      console.log(`Total Transactions: ${stats.totalTransactions}`);
      console.log(`Average Transaction: $${stats.avgTransaction.toFixed(2)}`);
      console.log(`Min Transaction: $${stats.minTransaction.toFixed(2)}`);
      console.log(`Max Transaction: $${stats.maxTransaction.toFixed(2)}`);
      console.log(`Total Tax Collected: $${stats.totalTax.toFixed(2)}`);
      console.log(`Total Subtotal: $${stats.totalSubtotal.toFixed(2)}`);
      console.log(
        `Target Achievement: ${((stats.totalSales / 7400) * 100).toFixed(1)}%`
      );
      console.log("");
    }

    // Payment method breakdown
    const paymentBreakdown = await collection
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
        { $unwind: "$paymentBreakdown" },
        {
          $group: {
            _id: "$paymentBreakdown.method",
            count: { $sum: 1 },
            totalAmount: { $sum: "$paymentBreakdown.amount" },
            avgAmount: { $avg: "$paymentBreakdown.amount" },
          },
        },
        { $sort: { totalAmount: -1 } },
      ])
      .toArray();

    console.log("💳 PAYMENT METHOD BREAKDOWN");
    let totalPayments = 0;
    paymentBreakdown.forEach((payment) => {
      totalPayments += payment.totalAmount;
      console.log(
        `${payment._id.toUpperCase()}: ${payment.count} transactions (${
          payment.count > 0
            ? (
                (payment.count / salesVerification[0]?.totalTransactions) *
                100
              ).toFixed(1)
            : 0
        }%) - $${payment.totalAmount.toFixed(2)}`
      );
    });
    console.log(`Total Payment Amounts: $${totalPayments.toFixed(2)}`);
    console.log("");

    // Daily distribution
    const dailyDistribution = await collection
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
            _id: { $dayOfWeek: "$timestamp" },
            count: { $sum: 1 },
            totalSales: { $sum: "$total" },
            avgTransaction: { $avg: "$total" },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    console.log("📅 DAILY DISTRIBUTION (Day of Week)");
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    dailyDistribution.forEach((day) => {
      const dayName = dayNames[day._id - 1];
      const percentage = salesVerification[0]
        ? ((day.count / salesVerification[0].totalTransactions) * 100).toFixed(
            1
          )
        : 0;
      console.log(
        `${dayName}: ${
          day.count
        } transactions (${percentage}%) - $${day.totalSales.toFixed(
          2
        )} - Avg: $${day.avgTransaction.toFixed(2)}`
      );
    });
    console.log("");

    // Hourly distribution
    const hourlyDistribution = await collection
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
            _id: { $hour: "$timestamp" },
            count: { $sum: 1 },
            totalSales: { $sum: "$total" },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    console.log("⏰ PEAK HOURS ANALYSIS");
    hourlyDistribution.forEach((hour) => {
      if (hour.count >= 5) {
        // Show hours with significant activity
        const percentage = salesVerification[0]
          ? (
              (hour.count / salesVerification[0].totalTransactions) *
              100
            ).toFixed(1)
          : 0;
        console.log(
          `${hour._id.toString().padStart(2, "0")}:00 - ${
            hour.count
          } transactions (${percentage}%) - $${hour.totalSales.toFixed(2)}`
        );
      }
    });
    console.log("");

    // Item category analysis
    const itemAnalysis = await collection
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
        { $unwind: "$items" },
        {
          $match: {
            "items.category": "Grocery",
          },
        },
        {
          $group: {
            _id: "$items.name",
            totalQuantity: { $sum: "$items.quantity" },
            totalRevenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
            avgPrice: { $avg: "$items.price" },
            transactions: { $sum: 1 },
          },
        },
        { $sort: { totalRevenue: -1 } },
      ])
      .toArray();

    console.log("🏆 TOP 10 SELLING ITEMS");
    itemAnalysis.slice(0, 10).forEach((item, index) => {
      console.log(
        `${(index + 1).toString().padStart(2)}. ${item._id} - Qty: ${
          item.totalQuantity
        }, Revenue: $${item.totalRevenue.toFixed(
          2
        )}, Avg Price: $${item.avgPrice.toFixed(2)}`
      );
    });
    console.log("");

    // Tax analysis
    const taxAnalysis = await collection
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
          $project: {
            taxableAmount: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: "$items",
                      cond: { $eq: ["$$this.taxable", true] },
                    },
                  },
                  as: "item",
                  in: { $multiply: ["$$item.price", "$$item.quantity"] },
                },
              },
            },
            nonTaxableAmount: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: "$items",
                      cond: { $eq: ["$$this.taxable", false] },
                    },
                  },
                  as: "item",
                  in: { $multiply: ["$$item.price", "$$item.quantity"] },
                },
              },
            },
            tax: 1,
            total: 1,
          },
        },
        {
          $group: {
            _id: null,
            totalTaxable: { $sum: "$taxableAmount" },
            totalNonTaxable: { $sum: "$nonTaxableAmount" },
            totalTax: { $sum: "$tax" },
            avgTaxRate: { $avg: { $divide: ["$tax", "$taxableAmount"] } },
          },
        },
      ])
      .toArray();

    if (taxAnalysis.length > 0) {
      const tax = taxAnalysis[0];
      console.log("🧮 TAX ANALYSIS");
      console.log(`Taxable Amount: $${tax.totalTaxable.toFixed(2)}`);
      console.log(`Non-Taxable Amount: $${tax.totalNonTaxable.toFixed(2)}`);
      console.log(`Total Tax Collected: $${tax.totalTax.toFixed(2)}`);
      console.log(`Effective Tax Rate: ${(tax.avgTaxRate * 100).toFixed(2)}%`);
      console.log(
        `Tax vs Expected (13%): $${tax.totalTax.toFixed(2)} vs $${(
          tax.totalTaxable * 0.13
        ).toFixed(2)}`
      );
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ July 2025 Grocery Sales Verification Complete");
  } catch (error) {
    console.error("❌ Verification error:", error);
  } finally {
    await client.close();
    console.log("🔌 Connection closed");
  }
}

verifyJulyGrocerySales();
