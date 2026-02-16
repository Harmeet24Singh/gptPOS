const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function checkJanuaryTotals() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB);

    console.log("📊 JANUARY 2026 SALES VERIFICATION");
    console.log("================================");

    // Get category totals
    const categories = await db
      .collection("transactions")
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date(2026, 0, 1),
              $lt: new Date(2026, 1, 1),
            },
          },
        },
        {
          $addFields: {
            category: {
              $cond: {
                if: {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: "$items",
                          cond: { $eq: ["$$this.category", "Alcohol"] },
                        },
                      },
                    },
                    0,
                  ],
                },
                then: "Alcohol",
                else: {
                  $cond: {
                    if: {
                      $gt: [
                        {
                          $size: {
                            $filter: {
                              input: "$items",
                              cond: { $eq: ["$$this.category", "Grocery"] },
                            },
                          },
                        },
                        0,
                      ],
                    },
                    then: "Grocery",
                    else: {
                      $cond: {
                        if: {
                          $gt: [
                            {
                              $size: {
                                $filter: {
                                  input: "$items",
                                  cond: { $eq: ["$$this.category", "Tobacco"] },
                                },
                              },
                            },
                            0,
                          ],
                        },
                        then: "Tobacco",
                        else: "Lottery",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: "$category",
            totalAmount: { $sum: "$total" },
            transactionCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    // Get overall totals
    const overall = await db
      .collection("transactions")
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date(2026, 0, 1),
              $lt: new Date(2026, 1, 1),
            },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$total" },
            cashSales: {
              $sum: {
                $cond: [{ $eq: ["$paymentMethod", "cash"] }, "$total", 0],
              },
            },
            cardSales: {
              $sum: {
                $cond: [{ $eq: ["$paymentMethod", "card"] }, "$total", 0],
              },
            },
            totalTransactions: { $sum: 1 },
          },
        },
      ])
      .toArray();

    console.log("\\n📈 CATEGORY BREAKDOWN:");
    categories.forEach((cat) => {
      const status = getStatus(cat._id, cat.totalAmount);
      console.log(
        `${getCategoryEmoji(cat._id)} ${cat._id}: $${cat.totalAmount.toFixed(2)} (${cat.transactionCount} transactions) ${status}`,
      );
    });

    console.log("\\n💰 OVERALL TOTALS:");
    const totals = overall[0];
    console.log(`📊 Total Sales: $${totals.totalSales.toFixed(2)}`);
    console.log(`💵 Cash Sales: $${totals.cashSales.toFixed(2)}`);
    console.log(
      `💳 Card Sales: $${totals.cardSales.toFixed(2)} ${totals.cardSales > 15000 ? "⚠️ OVER LIMIT" : "✅"}`,
    );
    console.log(`📝 Total Transactions: ${totals.totalTransactions}`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

function getStatus(category, amount) {
  const targets = {
    Alcohol: { target: 11000, emoji: "🍺" },
    Grocery: { target: 6000, emoji: "🛒" },
    Tobacco: { target: 8000, emoji: "🚬" },
    Lottery: { target: 19000, emoji: "🎲" },
  };

  const target = targets[category];
  if (!target) return "";

  const percentage = ((amount / target.target) * 100).toFixed(1);
  if (amount < target.target * 0.95) return "⚠️ Under target";
  if (amount > target.target * 1.05) return "⚠️ Over target";
  return "✅ On target";
}

function getCategoryEmoji(category) {
  const emojis = {
    Alcohol: "🍺",
    Grocery: "🛒",
    Tobacco: "🚬",
    Lottery: "🎲",
  };
  return emojis[category] || "📦";
}

checkJanuaryTotals();
