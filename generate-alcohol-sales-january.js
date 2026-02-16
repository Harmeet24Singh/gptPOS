const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function generateJanuaryAlcoholSales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Configuration for January 2026
    const TARGET_AMOUNT = 7200;
    const MONTH_START = new Date("2026-01-01T00:00:00.000Z");
    const MONTH_END = new Date("2026-02-01T00:00:00.000Z");

    console.log(`\n🎯 Target: $${TARGET_AMOUNT} for January 2026 alcohol sales`);

    // Check existing January transactions with alcohol
    const existingAlcohol = await collection
      .find({
        timestamp: { $gte: MONTH_START, $lt: MONTH_END },
        "items.category": "Alcohol"
      })
      .toArray();

    if (existingAlcohol.length > 0) {
      console.log(`⚠️  Found ${existingAlcohol.length} existing January alcohol transactions. Deleting first...`);
      
      for (const transaction of existingAlcohol) {
        await collection.deleteOne({ _id: transaction._id });
      }
      console.log(`✅ Cleared existing January alcohol data`);
    }

    // Get highest transaction ID to continue sequence
    const lastTransaction = await collection.findOne(
      { transactionId: { $exists: true } },
      { sort: { transactionId: -1 } }
    );
    
    let nextTransactionId = lastTransaction ? lastTransaction.transactionId + 1 : 210000;
    console.log(`🔢 Starting from transaction ID: ${nextTransactionId}`);

    // Calculate number of transactions needed (targeting ~$30-32 per transaction average)
    const avgTransactionAmount = 30.5; // Winter alcohol sales slightly higher per transaction
    const NUM_TRANSACTIONS = Math.round(TARGET_AMOUNT / avgTransactionAmount);

    console.log(`📊 Generating ${NUM_TRANSACTIONS} transactions with avg $${avgTransactionAmount.toFixed(2)}`);

    // Winter/New Year alcohol patterns - January typically slower than December
    const dayPatterns = {
      1: 0.08, // Monday - slow after weekend (8%)
      2: 0.12, // Tuesday - moderate (12%)
      3: 0.14, // Wednesday - moderate (14%)
      4: 0.16, // Thursday - building up (16%)
      5: 0.22, // Friday - high (22%)
      6: 0.20, // Saturday - high (20%)
      0: 0.08, // Sunday - slow (8%)
    };

    // Winter alcohol items - hearty beers, wines, spirits popular in January
    const alcoholItems = [
      {
        name: "Budweiser 6-pack",
        basePrice: 12.99,
        category: "Alcohol",
        taxable: true,
        barcode: "5060123456789"
      },
      {
        name: "Coors Light 12-pack",
        basePrice: 24.99,
        category: "Alcohol", 
        taxable: true,
        barcode: "5060123456790"
      },
      {
        name: "Corona 6-pack",
        basePrice: 15.99,
        category: "Alcohol",
        taxable: true,
        barcode: "5060123456791"
      },
      {
        name: "Heineken 6-pack",
        basePrice: 16.99,
        category: "Alcohol",
        taxable: true,
        barcode: "5060123456792"
      },
      {
        name: "Molson Canadian 12-pack",
        basePrice: 26.99,
        category: "Alcohol",
        taxable: true,
        barcode: "5060123456793"
      },
      {
        name: "Stella Artois 6-pack",
        basePrice: 17.99,
        category: "Alcohol",
        taxable: true,
        barcode: "5060123456794"
      },
      {
        name: "Blue Moon 6-pack",
        basePrice: 16.49,
        category: "Alcohol",
        taxable: true,
        barcode: "5060123456795"
      },
      {
        name: "Guinness 4-pack",
        basePrice: 18.99,
        category: "Alcohol",
        taxable: true,
        barcode: "5060123456796"
      },
      {
        name: "Red Wine Bottle",
        basePrice: 19.99,
        category: "Alcohol",
        taxable: true,
        barcode: "5060123456797"
      },
      {
        name: "White Wine Bottle",
        basePrice: 18.99,
        category: "Alcohol",
        taxable: true,
        barcode: "5060123456798"
      },
      {
        name: "Cabernet Sauvignon",
        basePrice: 22.99,
        category: "Alcohol",
        taxable: true,
        barcode: "5060123456799"
      },
      {
        name: "Chardonnay",
        basePrice: 19.49,
        category: "Alcohol",
        taxable: true,
        barcode: "5060123456800"
      },
      {
        name: "Vodka 750ml",
        basePrice: 24.99,
        category: "Alcohol",
        taxable: true,
        barcode: "5060123456801"
      },
      {
        name: "Whiskey 750ml",
        basePrice: 32.99,
        category: "Alcohol",
        taxable: true,
        barcode: "5060123456802"
      },
      {
        name: "Rum 750ml",
        basePrice: 28.99,
        category: "Alcohol",
        taxable: true,
        barcode: "5060123456803"
      }
    ];

    // Generate transactions
    const transactions = [];
    let totalGenerated = 0;

    for (let i = 0; i < NUM_TRANSACTIONS; i++) {
      // Random day in January 2026
      const day = Math.floor(Math.random() * 31) + 1;
      const dayOfWeek = new Date(2026, 0, day).getDay(); // 0 = Sunday

      // Apply day pattern (more sales on weekends)
      const dayMultiplier = dayPatterns[dayOfWeek];
      const shouldGenerate = Math.random() < dayMultiplier * 5; // Scale up probability

      if (!shouldGenerate && i < NUM_TRANSACTIONS * 0.8) continue; // Skip some but ensure we hit target

      // Random time during business hours (8 AM to 10 PM)
      const hour = Math.floor(Math.random() * 14) + 8;
      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);

      const timestamp = new Date(2026, 0, day, hour, minute, second);

      // Select 1-3 alcohol items per transaction
      const numItems = Math.random() < 0.6 ? 1 : Math.random() < 0.8 ? 2 : 3;
      const selectedItems = [];
      const usedIndexes = new Set();

      for (let j = 0; j < numItems; j++) {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * alcoholItems.length);
        } while (usedIndexes.has(randomIndex));
        
        usedIndexes.add(randomIndex);
        const item = { ...alcoholItems[randomIndex] };
        
        // Small price variations (±$1)
        const priceVariation = (Math.random() - 0.5) * 2;
        item.price = Math.max(item.basePrice + priceVariation, item.basePrice * 0.9);
        item.price = Math.round(item.price * 100) / 100;
        
        selectedItems.push({
          name: item.name,
          price: item.price,
          category: item.category,
          taxable: item.taxable,
          barcode: item.barcode,
          tax: Math.round(item.price * 0.13 * 100) / 100 // 13% tax
        });
      }

      const subtotal = selectedItems.reduce((sum, item) => sum + item.price, 0);
      const totalTax = selectedItems.reduce((sum, item) => sum + (item.tax || 0), 0);
      const total = Math.round((subtotal + totalTax) * 100) / 100;

      // Payment method (60% card, 40% cash for alcohol - typical pattern)
      const paymentMethod = Math.random() < 0.6 ? "card" : "cash";

      const transaction = {
        transactionId: nextTransactionId++,
        timestamp: timestamp,
        items: selectedItems,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(totalTax * 100) / 100,
        total: total,
        paymentMethod: paymentMethod,
        cashier: Math.random() < 0.7 ? "system" : "Admin User",
        transactionType: "sale"
      };

      // Add payment breakdown
      if (paymentMethod === "cash") {
        transaction.cashAmount = total;
        transaction.cardAmount = 0;
      } else {
        transaction.cashAmount = 0;
        transaction.cardAmount = total;
      }

      transactions.push(transaction);
      totalGenerated += total;

      // Stop if we've hit our target amount
      if (totalGenerated >= TARGET_AMOUNT) {
        break;
      }
    }

    console.log(`\n📝 Generated ${transactions.length} alcohol transactions`);
    console.log(`💰 Total amount: $${totalGenerated.toFixed(2)}`);
    console.log(`🎯 Target was: $${TARGET_AMOUNT}`);
    console.log(`📊 Accuracy: ${((totalGenerated / TARGET_AMOUNT) * 100).toFixed(1)}%`);

    // Insert transactions
    if (transactions.length > 0) {
      await collection.insertMany(transactions);
      console.log(`✅ Inserted ${transactions.length} January alcohol transactions`);
    }

    // Final verification
    const verification = await collection
      .find({
        timestamp: { $gte: MONTH_START, $lt: MONTH_END },
        "items.category": "Alcohol"
      })
      .toArray();

    const verificationTotal = verification.reduce(
      (sum, transaction) => sum + transaction.total,
      0
    );

    console.log(`\n🔍 Verification:`);
    console.log(`   January alcohol transactions: ${verification.length}`);
    console.log(`   January alcohol sales total: $${verificationTotal.toFixed(2)}`);

    // Payment method breakdown
    const cashTransactions = verification.filter(t => t.paymentMethod === "cash");
    const cardTransactions = verification.filter(t => t.paymentMethod === "card");
    
    console.log(`   Cash transactions: ${cashTransactions.length} (${((cashTransactions.length/verification.length)*100).toFixed(1)}%)`);
    console.log(`   Card transactions: ${cardTransactions.length} (${((cardTransactions.length/verification.length)*100).toFixed(1)}%)`);

  } catch (error) {
    console.error("Error generating January alcohol sales:", error);
  } finally {
    await client.close();
  }
}

// Run the function
generateJanuaryAlcoholSales();