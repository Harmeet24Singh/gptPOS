const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Categories with realistic items and payment preferences
const CATEGORY_CONFIG = {
  Alcohol: {
    items: [
      { name: "Budweiser 6-pack", basePrice: 12.99, variance: 0.8 },
      { name: "Corona 6-pack", basePrice: 14.99, variance: 0.7 },
      { name: "Heineken 6-pack", basePrice: 16.99, variance: 0.6 },
      { name: "Guinness 4-pack", basePrice: 18.99, variance: 0.9 },
      { name: "Red Wine Bottle", basePrice: 19.99, variance: 0.8 },
      { name: "White Wine Bottle", basePrice: 18.99, variance: 0.7 },
      { name: "Vodka 750ml", basePrice: 24.99, variance: 0.6 },
      { name: "Whiskey 750ml", basePrice: 29.99, variance: 0.8 },
      { name: "Tequila 750ml", basePrice: 22.99, variance: 0.7 },
      { name: "Rum 750ml", basePrice: 21.99, variance: 0.9 },
    ],
    cashPercent: 70,
    taxRate: 0.13,
    avgItemsPerTransaction: 1.8,
  },
  Grocery: {
    items: [
      { name: "Milk 1L", basePrice: 3.99, variance: 0.2 },
      { name: "Bread Loaf", basePrice: 2.99, variance: 0.3 },
      { name: "Eggs Dozen", basePrice: 4.99, variance: 0.4 },
      { name: "Bananas 1lb", basePrice: 1.99, variance: 0.3 },
      { name: "Apples 1lb", basePrice: 2.99, variance: 0.2 },
      { name: "Orange Juice 1L", basePrice: 4.99, variance: 0.3 },
      { name: "Chips Bag", basePrice: 3.99, variance: 0.5 },
      { name: "Soda 2L", basePrice: 2.99, variance: 0.4 },
      { name: "Frozen Pizza", basePrice: 6.99, variance: 0.6 },
      { name: "Ice Cream 1L", basePrice: 5.99, variance: 0.5 },
    ],
    cashPercent: 70,
    taxRate: 0.13,
    avgItemsPerTransaction: 3.2,
  },
  Tobacco: {
    items: [
      { name: "Marlboro Pack", basePrice: 14.99, variance: 0.3 },
      { name: "Camel Pack", basePrice: 13.99, variance: 0.4 },
      { name: "Newport Pack", basePrice: 15.99, variance: 0.2 },
      { name: "Parliament Pack", basePrice: 16.99, variance: 0.3 },
      { name: "Lucky Strike Pack", basePrice: 12.99, variance: 0.4 },
    ],
    cashPercent: 70,
    taxRate: 0.13,
    avgItemsPerTransaction: 1.2,
  },
  Lottery: {
    items: [
      { name: "Scratch Ticket $1", basePrice: 1.0, variance: 0 },
      { name: "Scratch Ticket $2", basePrice: 2.0, variance: 0 },
      { name: "Scratch Ticket $5", basePrice: 5.0, variance: 0 },
      { name: "Scratch Ticket $10", basePrice: 10.0, variance: 0 },
      { name: "Powerball Ticket", basePrice: 3.0, variance: 0 },
      { name: "Mega Millions Ticket", basePrice: 2.0, variance: 0 },
    ],
    cashPercent: 70,
    taxRate: 0,
    avgItemsPerTransaction: 2.1,
  },
};

function getRandomPrice(item) {
  const variance = item.basePrice * item.variance;
  return parseFloat(
    (item.basePrice + (Math.random() - 0.5) * variance).toFixed(2),
  );
}

function generateTransactionItems(category, targetAmount) {
  const config = CATEGORY_CONFIG[category];
  const items = [];
  let subtotal = 0;
  const numItems = Math.max(
    1,
    Math.round(config.avgItemsPerTransaction + (Math.random() - 0.5)),
  );

  for (let i = 0; i < numItems && subtotal < targetAmount * 0.9; i++) {
    const item = config.items[Math.floor(Math.random() * config.items.length)];
    const price = getRandomPrice(item);
    const tax = price * config.taxRate;

    items.push({
      name: item.name,
      price: price,
      category: category,
      taxable: config.taxRate > 0,
      barcode: `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`,
      tax: parseFloat(tax.toFixed(2)),
    });
    subtotal += price;
  }

  return items;
}

function generateTransaction(
  transactionId,
  month,
  year,
  category,
  targetAmount,
  forcePaymentMethod = null,
) {
  const items = generateTransactionItems(category, targetAmount);
  const subtotal = parseFloat(
    items.reduce((sum, item) => sum + item.price, 0).toFixed(2),
  );
  const totalTax = parseFloat(
    items.reduce((sum, item) => sum + item.tax, 0).toFixed(2),
  );
  const total = parseFloat((subtotal + totalTax).toFixed(2));

  const config = CATEGORY_CONFIG[category];
  let paymentMethod;

  if (forcePaymentMethod) {
    paymentMethod = forcePaymentMethod;
  } else {
    const isCash = Math.random() < config.cashPercent / 100;
    paymentMethod = isCash ? "cash" : "card";
  }

  // Generate random timestamp within the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const randomTime =
    startDate.getTime() +
    Math.random() * (endDate.getTime() - startDate.getTime());

  return {
    transactionId: transactionId,
    timestamp: new Date(randomTime),
    items: items,
    subtotal: subtotal,
    tax: totalTax,
    total: total,
    paymentMethod: paymentMethod,
    cashier: "system",
    store: "Main Store",
    transactionType: "sale",
    cardAmount: paymentMethod === "card" ? total : 0,
    cashAmount: paymentMethod === "cash" ? total : 0,
    cashback: 0,
    paymentBreakdown: [
      {
        method: paymentMethod,
        amount: total,
      },
    ],
    creditAmount: 0,
  };
}

async function getNextTransactionId(db) {
  const lastTransaction = await db
    .collection("transactions")
    .find({})
    .sort({ transactionId: -1 })
    .limit(1)
    .toArray();

  return lastTransaction.length > 0 ? lastTransaction[0].transactionId + 1 : 1;
}

async function testMarch2025() {
  console.log("🧪 TEST RUN: MARCH 2025 SALES GENERATION");
  console.log("=".repeat(50));

  // Hardcoded targets for test
  const categoryTargets = {
    Alcohol: 9000,
    Grocery: 4000,
    Tobacco: 7000,
    Lottery: 24000,
  };

  const totalTarget = Object.values(categoryTargets).reduce(
    (sum, val) => sum + val,
    0,
  );
  const month = 3; // March
  const year = 2025;

  console.log(`\n📅 TEST: Generating sales for March 2025`);
  console.log(`🎯 Targets:`);
  console.log(`   🍺 Alcohol: $${categoryTargets.Alcohol.toLocaleString()}`);
  console.log(`   🛒 Grocery: $${categoryTargets.Grocery.toLocaleString()}`);
  console.log(`   🚬 Tobacco: $${categoryTargets.Tobacco.toLocaleString()}`);
  console.log(`   🎲 Lottery: $${categoryTargets.Lottery.toLocaleString()}`);
  console.log(`   📊 Total: $${totalTarget.toLocaleString()}`);

  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB);

    // Check existing March 2025 sales by category
    const existingSalesByCategory = await db
      .collection("transactions")
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date(2025, 2, 1), // March 1, 2025
              $lt: new Date(2025, 3, 1), // April 1, 2025
            },
          },
        },
        {
          $unwind: "$items",
        },
        {
          $group: {
            _id: "$items.category",
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    console.log(`\n📊 Current March 2025 sales by category:`);

    let nextTransactionId = await getNextTransactionId(db);
    const transactions = [];
    let totalCardAmount = 0;
    const MAX_CARD_SALES = 15000;

    // Generate transactions for each category
    for (const [category, target] of Object.entries(categoryTargets)) {
      const existing = existingSalesByCategory.find((s) => s._id === category);
      const existingAmount = existing ? existing.total : 0;
      const existingCount = existing ? existing.count : 0;

      console.log(
        `   ${category}: $${existingAmount.toFixed(2)} (${existingCount} transactions)`,
      );

      if (existingAmount >= target * 0.95) {
        console.log(`     ✅ Target already reached!`);
        continue;
      }

      const remainingTarget = target - existingAmount;
      console.log(`     🎯 Need: $${remainingTarget.toFixed(2)}`);

      let categoryGenerated = 0;
      let categoryCount = 0;
      let categoryCash = 0;
      let categoryCard = 0;

      while (
        categoryGenerated < remainingTarget * 0.95 &&
        categoryCount < 500
      ) {
        const avgTransactionAmount =
          remainingTarget / Math.max(10, Math.floor(remainingTarget / 25));
        const transactionAmount = avgTransactionAmount * (0.5 + Math.random());

        // Determine payment method with card limit constraint
        let forcePaymentMethod = null;
        const wouldBeCardAmount = transactionAmount * 0.3; // 30% card target

        if (totalCardAmount + wouldBeCardAmount > MAX_CARD_SALES) {
          forcePaymentMethod = "cash"; // Force cash if card limit would be exceeded
        }

        const transaction = generateTransaction(
          nextTransactionId++,
          month,
          year,
          category,
          transactionAmount,
          forcePaymentMethod,
        );

        transactions.push(transaction);
        categoryGenerated += transaction.total;
        categoryCount++;

        if (transaction.paymentMethod === "cash") {
          categoryCash += transaction.total;
        } else {
          categoryCard += transaction.total;
          totalCardAmount += transaction.total;
        }

        // Stop if we hit card limit
        if (totalCardAmount >= MAX_CARD_SALES) {
          console.log(
            `     💳 Card limit of $${MAX_CARD_SALES} reached - remaining transactions will be cash only`,
          );
        }
      }

      const cashPercent = (categoryCash / (categoryCash + categoryCard)) * 100;
      console.log(
        `     ✅ Generated: ${categoryCount} transactions, $${categoryGenerated.toFixed(2)}`,
      );
      console.log(
        `     💰 Cash: $${categoryCash.toFixed(2)} (${cashPercent.toFixed(1)}%) | Card: $${categoryCard.toFixed(2)} (${(100 - cashPercent).toFixed(1)}%)`,
      );
    }

    if (transactions.length === 0) {
      console.log(
        "\n✅ All targets already reached! No new transactions needed.",
      );
      return;
    }

    console.log(`\n💾 Inserting ${transactions.length} transactions...`);
    await db.collection("transactions").insertMany(transactions);

    const finalTotalCard = transactions.reduce(
      (sum, t) => sum + t.cardAmount,
      0,
    );
    const finalTotalCash = transactions.reduce(
      (sum, t) => sum + t.cashAmount,
      0,
    );
    const finalTotal = finalTotalCard + finalTotalCash;

    console.log(`\n🎉 TEST SUCCESSFUL!`);
    console.log(`📊 March 2025 Generated Sales Summary:`);
    console.log(
      `   💰 Total Cash: $${finalTotalCash.toFixed(2)} (${((finalTotalCash / finalTotal) * 100).toFixed(1)}%)`,
    );
    console.log(
      `   💳 Total Card: $${finalTotalCard.toFixed(2)} (${((finalTotalCard / finalTotal) * 100).toFixed(1)}%)`,
    );
    console.log(`   📝 Total Transactions: ${transactions.length}`);
    console.log(
      `   🎯 Card Limit: ${finalTotalCard <= MAX_CARD_SALES ? "✅ Respected" : "❌ Exceeded"} ($${MAX_CARD_SALES} max)`,
    );

    // Final verification
    console.log(`\n🔍 Final March 2025 Totals by Category:`);
    const finalTotals = await db
      .collection("transactions")
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date(2025, 2, 1),
              $lt: new Date(2025, 3, 1),
            },
          },
        },
        {
          $unwind: "$items",
        },
        {
          $group: {
            _id: "$items.category",
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    finalTotals.forEach((cat) => {
      const target = categoryTargets[cat._id] || 0;
      const achievement =
        target > 0 ? ((cat.total / target) * 100).toFixed(1) : "0";
      console.log(
        `   ${cat._id}: $${cat.total.toFixed(2)} / $${target} (${achievement}% achieved)`,
      );
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

// Run the test
testMarch2025();
