const { MongoClient } = require('mongodb');
require('dotenv').config();

const url = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB || 'convenience_store';

async function checkRecentTransactions() {
  const client = new MongoClient(url);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection('transactions');
    
    // Get last 10 transactions to see what's recent
    const recentTransactions = await collection.find({})
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray();
    
    console.log(`\n📊 Last 20 transactions:`);
    
    let todayTotal = 0;
    const todayString = new Date().toDateString();
    
    recentTransactions.forEach((transaction, index) => {
      const transactionDate = new Date(transaction.timestamp);
      const transactionTotal = transaction.total || 0;
      const isToday = transactionDate.toDateString() === todayString;
      
      if (isToday) {
        todayTotal += transactionTotal;
      }
      
      console.log(`\n${index + 1}. ${isToday ? '🔥 TODAY:' : '📅'} Transaction ID: ${transaction._id.toString().slice(-8)}`);
      console.log(`   💰 Total: $${transactionTotal.toFixed(2)}`);
      console.log(`   📅 Date: ${transactionDate.toDateString()}`);
      console.log(`   ⏰ Time: ${transactionDate.toLocaleString()}`);
      console.log(`   🛒 Items: ${transaction.items ? transaction.items.length : 0}`);
      
      // Check for any transactions that total exactly $110.96 or close to it
      if (Math.abs(transactionTotal - 110.96) < 0.01) {
        console.log(`   🎯 MATCH! This transaction totals $${transactionTotal.toFixed(2)} (expected $110.96)`);
      }
    });
    
    console.log(`\n💰 Today's total from DB: $${todayTotal.toFixed(2)}`);
    
    // Check for transactions around $110.96
    const matchingTransactions = await collection.find({
      total: { $gte: 110.90, $lte: 111.00 }
    }).toArray();
    
    if (matchingTransactions.length > 0) {
      console.log(`\n🔍 Found transactions near $110.96:`);
      matchingTransactions.forEach(tx => {
        console.log(`   ID: ${tx._id.toString().slice(-8)} - $${tx.total.toFixed(2)} on ${new Date(tx.timestamp).toLocaleString()}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkRecentTransactions();