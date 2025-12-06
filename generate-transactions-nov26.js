const { MongoClient } = require("mongodb");

// MongoDB connection
const url = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

// Sample inventory items by category
const sampleItems = {
  lotto: [
    { id: 101, name: "Lotto Max", price: 5.00, category: "Lotto instant" },
    { id: 102, name: "649 Quick Pick", price: 3.00, category: "Lotto instant" },
    { id: 103, name: "Scratch Ticket $10", price: 10.00, category: "Lotto instant" },
    { id: 104, name: "Scratch Ticket $5", price: 5.00, category: "Lotto instant" },
    { id: 105, name: "Daily Grand", price: 3.00, category: "Lotto instant" },
  ],
  grocery: [
    { id: 201, name: "Coca Cola 355ml", price: 1.50, category: "Beverages" },
    { id: 202, name: "Lays Classic Chips", price: 2.99, category: "Snacks" },
    { id: 203, name: "Wonder Bread", price: 3.49, category: "Bakery" },
    { id: 204, name: "Red Bull 250ml", price: 3.99, category: "Beverages" },
    { id: 205, name: "Kit Kat Bar", price: 1.25, category: "Candy" },
    { id: 206, name: "Milk 2L", price: 4.99, category: "Dairy" },
    { id: 207, name: "Bananas (lb)", price: 1.29, category: "Fresh Produce" },
    { id: 208, name: "Coffee 454g", price: 8.99, category: "Beverages" },
  ],
  tobacco: [
    { id: 301, name: "Marlboro Gold", price: 15.99, category: "Tobacco" },
    { id: 302, name: "Canadian Classic", price: 14.50, category: "Tobacco" },
    { id: 303, name: "Export A", price: 16.25, category: "Tobacco" },
  ]
};

function getRandomItem(category) {
  const items = sampleItems[category];
  return items[Math.floor(Math.random() * items.length)];
}

function getRandomQuantity(item) {
  // Adjust quantity based on item type
  if (item.category === "Tobacco") return 1; // Usually 1 pack
  if (item.category === "Lotto instant") return Math.floor(Math.random() * 3) + 1; // 1-3 tickets
  return Math.floor(Math.random() * 4) + 1; // 1-4 for grocery items
}

function generatePaymentBreakdown(total, paymentType) {
  const breakdown = [];
  
  switch (paymentType) {
    case "cash":
      breakdown.push({ method: "cash", amount: total });
      break;
    case "card":
      breakdown.push({ method: "card", amount: total });
      break;
    case "mixed":
      const cashPortion = Math.round((total * 0.6) * 100) / 100; // 60% cash
      const cardPortion = Math.round((total - cashPortion) * 100) / 100;
      breakdown.push({ method: "cash", amount: cashPortion });
      breakdown.push({ method: "card", amount: cardPortion });
      break;
    case "credit":
      breakdown.push({ method: "credit", amount: total });
      break;
  }
  
  return breakdown;
}

function generateTransaction(timestamp, categories, paymentMethods) {
  const items = [];
  let subtotal = 0;
  let taxableAmount = 0;
  let nonTaxableAmount = 0;
  
  // Generate 1-4 items per transaction
  const itemCount = Math.floor(Math.random() * 4) + 1;
  
  for (let i = 0; i < itemCount; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const item = getRandomItem(category);
    const quantity = getRandomQuantity(item);
    const itemTotal = item.price * quantity;
    
    items.push({
      product_id: item.id,
      name: item.name,
      quantity: quantity,
      price: item.price,
      applyTax: item.category !== "Fresh Produce" && item.category !== "Dairy" // Some items are tax-exempt
    });
    
    subtotal += itemTotal;
    
    if (item.category !== "Fresh Produce" && item.category !== "Dairy") {
      taxableAmount += itemTotal;
    } else {
      nonTaxableAmount += itemTotal;
    }
  }
  
  // Round to 2 decimal places
  subtotal = Math.round(subtotal * 100) / 100;
  taxableAmount = Math.round(taxableAmount * 100) / 100;
  nonTaxableAmount = Math.round(nonTaxableAmount * 100) / 100;
  
  // Calculate HST (13% in Ontario)
  const tax = Math.round(taxableAmount * 0.13 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  
  // Select payment method
  const paymentType = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
  const paymentBreakdown = generatePaymentBreakdown(total, paymentType);
  
  // Determine transaction type
  let transactionType = paymentType;
  let cashAmount = 0;
  let cardAmount = 0;
  let creditAmount = 0;
  
  paymentBreakdown.forEach(payment => {
    switch (payment.method) {
      case "cash": cashAmount += payment.amount; break;
      case "card": cardAmount += payment.amount; break;
      case "credit": creditAmount += payment.amount; break;
    }
  });
  
  return {
    timestamp: timestamp,
    subtotal: subtotal,
    taxableAmount: taxableAmount,
    nonTaxableAmount: nonTaxableAmount,
    tax: tax,
    total: total,
    cashback: 0,
    paymentBreakdown: paymentBreakdown,
    change: paymentType === "cash" ? Math.round((Math.ceil(total * 4) / 4 - total) * 100) / 100 : 0, // Round up to nearest quarter for cash
    transactionType: transactionType,
    cashAmount: cashAmount,
    cardAmount: cardAmount,
    creditAmount: creditAmount,
    items: items
  };
}

async function generateTransactionsForDate() {
  const client = new MongoClient(url, { useUnifiedTopology: true });
  
  try {
    await client.connect();
    const db = client.db(dbName);
    
    // Target date: November 26, 2025
    const targetDate = new Date("2025-11-26");
    
    // Define distribution
    const categories = ["lotto", "grocery", "tobacco"]; // Focus on these categories
    const paymentMethods = ["cash", "card", "mixed", "credit"];
    
    // Generate transactions throughout the day
    const transactions = [];
    let totalSales = 0;
    const targetSales = 3200;
    
    // Generate transactions from 7 AM to 11 PM (16 hours)
    const startHour = 7;
    const endHour = 23;
    
    while (totalSales < targetSales * 0.95) { // Generate until we're close to target
      // Random hour between 7 AM and 11 PM
      const hour = startHour + Math.floor(Math.random() * (endHour - startHour));
      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);
      
      const timestamp = new Date(targetDate);
      timestamp.setHours(hour, minute, second);
      
      // Weight categories based on typical convenience store sales
      let categoryWeights;
      if (totalSales < targetSales * 0.4) {
        // More lotto early in generation
        categoryWeights = ["lotto", "lotto", "grocery", "tobacco"];
      } else if (totalSales < targetSales * 0.8) {
        // More grocery in middle
        categoryWeights = ["grocery", "grocery", "lotto", "tobacco"];
      } else {
        // Mixed towards the end
        categoryWeights = ["grocery", "lotto", "tobacco"];
      }
      
      const transaction = generateTransaction(timestamp, categoryWeights, paymentMethods);
      transactions.push(transaction);
      totalSales += transaction.total;
      
      // Prevent infinite loop
      if (transactions.length > 200) break;
    }
    
    // Sort transactions by timestamp
    transactions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    console.log(`Generated ${transactions.length} transactions`);
    console.log(`Total sales: $${totalSales.toFixed(2)}`);
    
    // Calculate distribution
    const lottoSales = transactions.filter(t => 
      t.items.some(item => item.name.includes("Lotto") || item.name.includes("Scratch"))
    ).reduce((sum, t) => sum + t.total, 0);
    
    const grocerySales = transactions.filter(t => 
      t.items.some(item => !item.name.includes("Lotto") && !item.name.includes("Scratch") && !item.name.includes("Marlboro") && !item.name.includes("Canadian") && !item.name.includes("Export"))
    ).reduce((sum, t) => sum + t.total, 0);
    
    const tobaccoSales = transactions.filter(t => 
      t.items.some(item => item.name.includes("Marlboro") || item.name.includes("Canadian") || item.name.includes("Export"))
    ).reduce((sum, t) => sum + t.total, 0);
    
    const cashSales = transactions.reduce((sum, t) => sum + t.cashAmount, 0);
    const cardSales = transactions.reduce((sum, t) => sum + t.cardAmount, 0);
    const creditSales = transactions.reduce((sum, t) => sum + t.creditAmount, 0);
    
    console.log(`\nSales by category:`);
    console.log(`Lotto: $${lottoSales.toFixed(2)}`);
    console.log(`Grocery: $${grocerySales.toFixed(2)}`);
    console.log(`Tobacco: $${tobaccoSales.toFixed(2)}`);
    
    console.log(`\nSales by payment method:`);
    console.log(`Cash: $${cashSales.toFixed(2)}`);
    console.log(`Card: $${cardSales.toFixed(2)}`);
    console.log(`Credit: $${creditSales.toFixed(2)}`);
    
    // Insert transactions into database
    if (transactions.length > 0) {
      const result = await db.collection("transactions").insertMany(transactions);
      console.log(`\n✅ Successfully inserted ${result.insertedCount} transactions into database`);
      console.log(`Date: November 26, 2025`);
      console.log(`Total Sales: $${totalSales.toFixed(2)}`);
    }
    
  } catch (error) {
    console.error("Error generating transactions:", error);
  } finally {
    await client.close();
  }
}

// Run the script
generateTransactionsForDate().catch(console.error);