const { MongoClient } = require("mongodb");
require("dotenv").config();

async function adjustJanuaryAlcoholSales() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB);
    const collection = db.collection("transactions");

    console.log("🔧 Adjusting January Alcohol Sales to reach $7200 target\n");

    // Check current January alcohol sales
    const currentAlcohol = await collection
      .find({
        timestamp: { $gte: new Date("2026-01-01"), $lt: new Date("2026-02-01") },
        "items.category": "Alcohol"
      })
      .toArray();

    const currentTotal = currentAlcohol.reduce((sum, t) => sum + t.total, 0);
    const needed = 7200 - currentTotal;

    console.log(`Current alcohol sales: $${currentTotal.toFixed(2)}`);
    console.log(`Target: $7200.00`);
    console.log(`Additional needed: $${needed.toFixed(2)}`);

    if (needed <= 50) {
      console.log("✅ Already very close to target! No adjustment needed.");
      return;
    }

    // Get next transaction ID
    const lastTransaction = await collection.findOne(
      { transactionId: { $exists: true } },
      { sort: { transactionId: -1 } }
    );
    
    let nextTransactionId = lastTransaction.transactionId + 1;

    // Premium alcohol items for additional sales
    const premiumAlcohol = [
      {
        name: "Premium Vodka 750ml",
        basePrice: 45.99,
        category: "Alcohol",
        barcode: "5060123456810"
      },
      {
        name: "Single Malt Whiskey",
        basePrice: 65.99,
        category: "Alcohol", 
        barcode: "5060123456811"
      },
      {
        name: "Champagne Bottle",
        basePrice: 39.99,
        category: "Alcohol",
        barcode: "5060123456812"
      },
      {
        name: "Craft Beer 12-pack",
        basePrice: 32.99,
        category: "Alcohol",
        barcode: "5060123456813"
      }
    ];

    // Generate additional transactions to reach target
    const additionalTransactions = [];
    let additionalTotal = 0;
    const numAdditional = Math.ceil(needed / 40); // ~$40 average

    for (let i = 0; i < numAdditional && additionalTotal < needed; i++) {
      const day = Math.floor(Math.random() * 31) + 1;
      const hour = Math.floor(Math.random() * 14) + 8;
      const minute = Math.floor(Math.random() * 60);
      
      const timestamp = new Date(2026, 0, day, hour, minute, 0);
      
      // Select premium item
      const item = premiumAlcohol[Math.floor(Math.random() * premiumAlcohol.length)];
      const price = item.basePrice + (Math.random() - 0.5) * 3; // ±$1.50 variation
      const finalPrice = Math.round(price * 100) / 100;
      const tax = Math.round(finalPrice * 0.13 * 100) / 100;
      const total = Math.round((finalPrice + tax) * 100) / 100;

      const transaction = {
        transactionId: nextTransactionId++,
        timestamp: timestamp,
        items: [{
          name: item.name,
          price: finalPrice,
          category: item.category,
          taxable: true,
          barcode: item.barcode,
          tax: tax
        }],
        subtotal: finalPrice,
        tax: tax,
        total: total,
        paymentMethod: Math.random() < 0.7 ? "card" : "cash",
        cashier: "system",
        transactionType: "sale"
      };

      // Add payment breakdown
      if (transaction.paymentMethod === "cash") {
        transaction.cashAmount = total;
        transaction.cardAmount = 0;
      } else {
        transaction.cashAmount = 0;
        transaction.cardAmount = total;
      }

      additionalTransactions.push(transaction);
      additionalTotal += total;
    }

    // Insert additional transactions
    if (additionalTransactions.length > 0) {
      await collection.insertMany(additionalTransactions);
      console.log(`✅ Added ${additionalTransactions.length} premium alcohol transactions (+$${additionalTotal.toFixed(2)})`);
    }

    // Final verification
    const finalCheck = await collection
      .find({
        timestamp: { $gte: new Date("2026-01-01"), $lt: new Date("2026-02-01") },
        "items.category": "Alcohol"
      })
      .toArray();

    const finalTotal = finalCheck.reduce((sum, t) => sum + t.total, 0);
    
    console.log(`\n🎉 FINAL JANUARY ALCOHOL SALES:`);
    console.log(`   Transactions: ${finalCheck.length}`);
    console.log(`   Total Sales: $${finalTotal.toFixed(2)}`);
    console.log(`   Target: $7200.00`);
    console.log(`   Accuracy: ${((finalTotal/7200)*100).toFixed(1)}%`);
    console.log(`   Difference: $${(finalTotal - 7200).toFixed(2)}`);

  } catch (error) {
    console.error("Error adjusting January alcohol sales:", error);
  } finally {
    await client.close();
  }
}

adjustJanuaryAlcoholSales();