const { MongoClient } = require('mongodb');

const url = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB || 'convenience_store';

async function checkTransactions() {
  const client = new MongoClient(url);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // Check for Nov 18, 2025 transactions
    const nov18Start = new Date('2025-11-18T00:00:00.000Z');
    const nov18End = new Date('2025-11-19T00:00:00.000Z');
    
    console.log('Searching for transactions between:', nov18Start, 'and', nov18End);
    
    const transactions = await db.collection('transactions').find({
      timestamp: { $gte: nov18Start, $lt: nov18End }
    }).toArray();
    
    console.log(`Nov 18, 2025 transactions found: ${transactions.length}`);
    
    if (transactions.length > 0) {
      console.log('\nFirst 3 transactions:');
      transactions.slice(0, 3).forEach((tx, i) => {
        console.log(`${i + 1}. ID: ${tx._id}`);
        console.log(`   Timestamp: ${tx.timestamp}`);
        console.log(`   Total: $${tx.total}`);
        console.log(`   Type: ${tx.transactionType}`);
      });
      
      // Check total sales
      const totalSales = transactions.reduce((sum, tx) => {
        if (tx.transactionType === 'lotto') {
          return sum - tx.total; // Subtract lottery payouts
        }
        return sum + tx.total;
      }, 0);
      console.log(`\nTotal sales for Nov 18: $${totalSales.toFixed(2)}`);
    }
    
    // Also check all transactions count
    const allCount = await db.collection('transactions').countDocuments();
    console.log(`\nTotal transactions in database: ${allCount}`);
    
    // Check recent transactions
    const recent = await db.collection('transactions')
      .find({})
      .sort({ _id: -1 })
      .limit(5)
      .toArray();
    
    console.log('\nMost recent 5 transactions:');
    recent.forEach((tx, i) => {
      console.log(`${i + 1}. ${new Date(tx.timestamp).toLocaleString()} - $${tx.total} (${tx.transactionType})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkTransactions();
