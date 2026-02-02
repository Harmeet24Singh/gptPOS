const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkTransaction() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    console.log('📡 Connected to MongoDB Atlas');
    
    const db = client.db('convenience_store');
    const transactions = db.collection('transactions');
    
    // Search for transaction around the specific time: 1/28/2026, 9:02:35 PM
    const targetDate = new Date('2026-01-28T21:02:35');
    const beforeTime = new Date(targetDate.getTime() - 5 * 60 * 1000); // 5 minutes before
    const afterTime = new Date(targetDate.getTime() + 5 * 60 * 1000);  // 5 minutes after
    
    console.log(`\n🕘 Searching for transactions around 1/28/2026, 9:02:35 PM:`);
    console.log(`Range: ${beforeTime.toLocaleString()} to ${afterTime.toLocaleString()}`);
    
    const timeRangeTransactions = await transactions.find({
      createdAt: {
        $gte: beforeTime,
        $lte: afterTime
      }
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`Found ${timeRangeTransactions.length} transactions in that time range:`);
    timeRangeTransactions.forEach(t => {
      console.log(`ID: ${t._id} | Total: $${t.total} | Type: ${t.transactionType || 'N/A'} | Date: ${t.createdAt}`);
      if (t._id.includes('d548f8a6') || t.total === -100 || t.total === 100) {
        console.log('  ⭐ POTENTIAL MATCH - Full details:');
        console.log(JSON.stringify(t, null, 4));
      }
    });
    
    // Check today's transactions (January 28, 2026)
    const today = new Date('2026-01-28');
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log(`\n📅 All transactions from today (${today.toDateString()}):`);
    const todayTransactions = await transactions.find({
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`Found ${todayTransactions.length} transactions today:`);
    todayTransactions.forEach(t => {
      console.log(`ID: ${t._id} | Total: $${t.total} | Type: ${t.transactionType || 'N/A'} | Date: ${t.createdAt}`);
    });
    
    // Search for any transaction containing the ID fragment
    console.log('\n🔍 Searching for ANY transaction containing "d548f8a6":');
    const idMatches = await transactions.find({ 
      _id: { $regex: 'd548f8a6', $options: 'i' }
    }).toArray();
    
    if (idMatches.length > 0) {
      console.log('✅ Found ID matches:');
      idMatches.forEach(t => {
        console.log(`ID: ${t._id} | Total: $${t.total} | Type: ${t.transactionType || 'N/A'} | Date: ${t.createdAt}`);
        console.log(JSON.stringify(t, null, 2));
      });
    } else {
      console.log('❌ No ID matches found');
    }
    
    // Search for negative transactions that might be lottery payouts
    console.log('\n💸 Recent negative transactions (lottery payouts):');
    const negativeTransactions = await transactions.find({ 
      total: { $lt: 0 } 
    }).sort({ createdAt: -1 }).limit(10).toArray();
    
    console.log(`Found ${negativeTransactions.length} recent negative transactions:`);
    negativeTransactions.forEach(t => {
      console.log(`ID: ${t._id} | Total: $${t.total} | Type: ${t.transactionType || 'N/A'} | Date: ${t.createdAt}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('📡 Disconnected from MongoDB');
  }
}

checkTransaction();