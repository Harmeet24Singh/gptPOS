const { MongoClient } = require('mongodb');

const url = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB || 'convenience_store';

// Sample inventory items with realistic pricing for convenience store
const inventoryItems = [
  // Tobacco products (high margin, frequent sales)
  { name: 'Marlboro Red Pack', price: 16.50, category: 'Tobacco', taxable: true },
  { name: 'Camel Blue Pack', price: 15.75, category: 'Tobacco', taxable: true },
  { name: 'Newport Menthol Pack', price: 16.25, category: 'Tobacco', taxable: true },
  { name: 'Vuse Alto Pod', price: 7.99, category: 'Tobacco', taxable: true },
  { name: 'JUUL Pod 2-pack', price: 12.99, category: 'Tobacco', taxable: true },
  
  // Beverages (high volume)
  { name: 'Coca Cola 500ml', price: 2.49, category: 'Beverages', taxable: true },
  { name: 'Pepsi 500ml', price: 2.39, category: 'Beverages', taxable: true },
  { name: 'Red Bull 250ml', price: 3.99, category: 'Beverages', taxable: true },
  { name: 'Monster Energy', price: 3.79, category: 'Beverages', taxable: true },
  { name: 'Coffee Large', price: 2.25, category: 'Beverages', taxable: true },
  { name: 'Slurpee Large', price: 1.89, category: 'Beverages', taxable: true },
  { name: 'Bottled Water', price: 1.99, category: 'Beverages', taxable: true },
  
  // Snacks
  { name: 'Lay\'s Chips Regular', price: 2.99, category: 'Snacks', taxable: true },
  { name: 'Doritos Nacho Cheese', price: 3.49, category: 'Snacks', taxable: true },
  { name: 'Kit Kat Bar', price: 1.79, category: 'Snacks', taxable: true },
  { name: 'Snickers Bar', price: 1.85, category: 'Snacks', taxable: true },
  { name: 'Reese\'s Peanut Butter Cup', price: 1.69, category: 'Snacks', taxable: true },
  { name: 'Beef Jerky', price: 5.99, category: 'Snacks', taxable: true },
  
  // Lottery (high frequency, various amounts)
  { name: 'Scratch Ticket $1', price: 1.00, category: 'Lottery', taxable: false },
  { name: 'Scratch Ticket $2', price: 2.00, category: 'Lottery', taxable: false },
  { name: 'Scratch Ticket $5', price: 5.00, category: 'Lottery', taxable: false },
  { name: 'Scratch Ticket $10', price: 10.00, category: 'Lottery', taxable: false },
  { name: 'Lotto Max', price: 5.00, category: 'Lottery', taxable: false },
  { name: 'Lotto 649', price: 3.00, category: 'Lottery', taxable: false },
  
  // Household items
  { name: 'Toilet Paper 4-pack', price: 8.99, category: 'Household', taxable: true },
  { name: 'Paper Towels', price: 6.49, category: 'Household', taxable: true },
  { name: 'Laundry Detergent Small', price: 4.99, category: 'Household', taxable: true },
  { name: 'Dish Soap', price: 3.29, category: 'Household', taxable: true },
  
  // Automotive
  { name: 'Motor Oil 1L', price: 12.99, category: 'Automotive', taxable: true },
  { name: 'Windshield Washer Fluid', price: 4.99, category: 'Automotive', taxable: true },
  
  // Personal Care
  { name: 'Toothpaste', price: 4.49, category: 'Personal Care', taxable: true },
  { name: 'Shampoo Travel Size', price: 3.99, category: 'Personal Care', taxable: true },
  { name: 'Advil 20ct', price: 7.99, category: 'Personal Care', taxable: false }, // Medicine not taxed
  { name: 'Tylenol 20ct', price: 8.49, category: 'Personal Care', taxable: false },
  
  // Food items
  { name: 'Sandwich White Bread', price: 2.99, category: 'Food', taxable: false }, // Basic groceries not taxed
  { name: 'Milk 1L', price: 3.49, category: 'Food', taxable: false },
  { name: 'Eggs 12ct', price: 4.99, category: 'Food', taxable: false },
  { name: 'Bananas per lb', price: 1.29, category: 'Food', taxable: false },
  { name: 'Instant Noodles', price: 1.49, category: 'Food', taxable: false },
  
  // Lotto winnings (negative amounts - money going out)
  { name: 'Lotto Winnings', price: -25.00, category: 'Lottery', taxable: false },
  { name: 'Lotto Winnings', price: -50.00, category: 'Lottery', taxable: false },
  { name: 'Lotto Winnings', price: -100.00, category: 'Lottery', taxable: false },
  { name: 'Lotto Winnings', price: -10.00, category: 'Lottery', taxable: false },
  { name: 'Lotto Winnings', price: -20.00, category: 'Lottery', taxable: false },
];

// Transaction type weights (higher = more frequent)
const transactionTypeWeights = {
  cash: 45,
  card: 35,
  mixed: 12,
  credit: 5,
  lotto: 3  // Lottery redemption transactions
};

// Hourly distribution weights for Nov 18 (Monday) - typical convenience store pattern
const hourlyWeights = {
  6: 5,   // Early morning
  7: 15,  // Morning rush
  8: 20,  // Peak morning
  9: 12,
  10: 8,
  11: 10,
  12: 18, // Lunch rush
  13: 15, // Lunch continuation
  14: 8,
  15: 10,
  16: 12,
  17: 20, // Evening rush
  18: 18, // Peak evening
  19: 15,
  20: 12,
  21: 8,
  22: 5,
  23: 3
};

function getRandomItem(items, weights = null) {
  if (!weights) return items[Math.floor(Math.random() * items.length)];
  
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const [item, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) return item;
  }
  
  return Object.keys(weights)[0];
}

function getRandomHour() {
  return parseInt(getRandomItem(Object.keys(hourlyWeights), hourlyWeights));
}

function generateTransactionId() {
  return Math.random().toString(36).substr(2, 9);
}

function generateTransaction(baseDate, hour) {
  const transactionType = getRandomItem(Object.keys(transactionTypeWeights), transactionTypeWeights);
  
  // Create timestamp for Nov 18, 2025 at the specified hour (local timezone)
  const timestamp = new Date(2025, 10, 18, hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60)); // Month is 0-indexed, so 10 = November
  
  const items = [];
  const numItems = transactionType === 'lotto' ? 1 : Math.floor(Math.random() * 4) + 1; // 1-4 items, lottery only 1
  
  let subtotal = 0;
  let taxableAmount = 0;
  let nonTaxableAmount = 0;
  
  // For lottery redemption, use negative amounts (winnings paid out)
  if (transactionType === 'lotto') {
    const winningItems = inventoryItems.filter(item => item.name === 'Lotto Winnings');
    const winningItem = getRandomItem(winningItems);
    
    const quantity = 1;
    const totalPrice = Math.abs(winningItem.price) * quantity; // Make it positive for display but track as lotto
    
    items.push({
      id: generateTransactionId(),
      name: winningItem.name,
      price: Math.abs(winningItem.price), // Display as positive
      quantity: quantity,
      category: winningItem.category,
      taxable: winningItem.taxable
    });
    
    subtotal = totalPrice;
    nonTaxableAmount = totalPrice; // Lottery winnings not taxed
  } else {
    // Regular transaction
    for (let i = 0; i < numItems; i++) {
      const item = getRandomItem(inventoryItems.filter(item => item.price > 0)); // Only positive priced items
      const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
      const totalPrice = item.price * quantity;
      
      items.push({
        id: generateTransactionId(),
        name: item.name,
        price: item.price,
        quantity: quantity,
        category: item.category,
        taxable: item.taxable
      });
      
      subtotal += totalPrice;
      
      if (item.taxable) {
        taxableAmount += totalPrice;
      } else {
        nonTaxableAmount += totalPrice;
      }
    }
  }
  
  // Calculate tax (13% HST in Ontario, Canada)
  const tax = taxableAmount * 0.13;
  const total = subtotal + tax;
  
  // Generate payment breakdown based on transaction type
  let paymentBreakdown = [];
  let cashAmount = 0;
  let cardAmount = 0;
  let creditAmount = 0;
  
  if (transactionType === 'lotto') {
    // Lottery redemption - cash going out
    cashAmount = -total; // Negative because cash is going out
    paymentBreakdown = [{ method: 'cash', amount: -total }];
  } else if (transactionType === 'cash') {
    cashAmount = total;
    paymentBreakdown = [{ method: 'cash', amount: total }];
  } else if (transactionType === 'card') {
    cardAmount = total;
    paymentBreakdown = [{ method: 'card', amount: total }];
  } else if (transactionType === 'mixed') {
    // Split between cash and card
    cashAmount = Math.round((total * (0.3 + Math.random() * 0.4)) * 100) / 100; // 30-70% cash
    cardAmount = Math.round((total - cashAmount) * 100) / 100;
    paymentBreakdown = [
      { method: 'cash', amount: cashAmount },
      { method: 'card', amount: cardAmount }
    ];
  } else if (transactionType === 'credit') {
    creditAmount = total;
    paymentBreakdown = [{ method: 'credit', amount: total }];
  }
  
  return {
    id: generateTransactionId(),
    timestamp: timestamp,
    items: items,
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    nonTaxableAmount: Math.round(nonTaxableAmount * 100) / 100,
    includeTax: tax > 0,
    paymentBreakdown: paymentBreakdown,
    transactionType: transactionType,
    cashAmount: cashAmount,
    cardAmount: cardAmount,
    creditAmount: creditAmount
  };
}

async function generateTransactionsForNov18() {
  const client = new MongoClient(url, { useUnifiedTopology: true });
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection('transactions');
    
    // Base date for November 18, 2025 (using local timezone)
    // No need to pass date to generateTransaction anymore
    
    const transactions = [];
    let totalSales = 0;
    const targetSales = 4200;
    
    // Generate transactions until we reach approximately $4200
    while (totalSales < targetSales) {
      const hour = getRandomHour();
      const transaction = generateTransaction(null, hour);
      
      // For lotto transactions, subtract from total (money going out)
      if (transaction.transactionType === 'lotto') {
        totalSales -= transaction.total;
      } else {
        totalSales += transaction.total;
      }
      
      transactions.push(transaction);
      
      // Safety check to prevent infinite loop
      if (transactions.length > 200) break;
    }
    
    console.log(`Generated ${transactions.length} transactions`);
    console.log(`Total sales amount: $${totalSales.toFixed(2)}`);
    
    // Count transactions by type
    const typeCounts = {};
    transactions.forEach(t => {
      typeCounts[t.transactionType] = (typeCounts[t.transactionType] || 0) + 1;
    });
    console.log('Transaction types:', typeCounts);
    
    // Insert transactions
    if (transactions.length > 0) {
      const result = await collection.insertMany(transactions);
      console.log(`Inserted ${result.insertedCount} transactions into database`);
      
      // Show breakdown
      const cashTransactions = transactions.filter(t => t.transactionType === 'cash');
      const cardTransactions = transactions.filter(t => t.transactionType === 'card');
      const mixedTransactions = transactions.filter(t => t.transactionType === 'mixed');
      const creditTransactions = transactions.filter(t => t.transactionType === 'credit');
      const lottoTransactions = transactions.filter(t => t.transactionType === 'lotto');
      
      const cashTotal = cashTransactions.reduce((sum, t) => sum + t.total, 0);
      const cardTotal = cardTransactions.reduce((sum, t) => sum + t.total, 0);
      const mixedTotal = mixedTransactions.reduce((sum, t) => sum + t.total, 0);
      const creditTotal = creditTransactions.reduce((sum, t) => sum + t.total, 0);
      const lottoTotal = lottoTransactions.reduce((sum, t) => sum + t.total, 0);
      
      console.log('\n=== NOVEMBER 18, 2025 SALES BREAKDOWN ===');
      console.log(`Cash transactions: ${cashTransactions.length} ($${cashTotal.toFixed(2)})`);
      console.log(`Card transactions: ${cardTransactions.length} ($${cardTotal.toFixed(2)})`);
      console.log(`Mixed transactions: ${mixedTransactions.length} ($${mixedTotal.toFixed(2)})`);
      console.log(`Credit transactions: ${creditTransactions.length} ($${creditTotal.toFixed(2)})`);
      console.log(`Lotto redemptions: ${lottoTransactions.length} ($${lottoTotal.toFixed(2)} paid out)`);
      console.log(`\nNet sales total: $${(cashTotal + cardTotal + mixedTotal + creditTotal - lottoTotal).toFixed(2)}`);
      
      // Show hourly distribution
      const hourlyTotals = {};
      transactions.forEach(t => {
        const hour = new Date(t.timestamp).getHours();
        if (!hourlyTotals[hour]) hourlyTotals[hour] = { count: 0, sales: 0 };
        hourlyTotals[hour].count++;
        if (t.transactionType === 'lotto') {
          hourlyTotals[hour].sales -= t.total; // Subtract lotto payouts
        } else {
          hourlyTotals[hour].sales += t.total;
        }
      });
      
      console.log('\n=== HOURLY BREAKDOWN ===');
      Object.keys(hourlyTotals).sort((a, b) => parseInt(a) - parseInt(b)).forEach(hour => {
        const data = hourlyTotals[hour];
        console.log(`${hour}:00 - ${data.count} transactions, $${data.sales.toFixed(2)}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

console.log('Generating transactions for November 18, 2025...');
generateTransactionsForNov18();