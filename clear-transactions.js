const { MongoClient } = require('mongodb');
require('dotenv').config();

async function clearTodaysTransactions() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('gptpos');
    const collection = db.collection('transactions');
    
    // Get today's date range (start and end of today)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    console.log(`Clearing transactions from ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
    
    // Delete transactions from today
    const result = await collection.deleteMany({
      timestamp: {
        $gte: startOfDay.toISOString(),
        $lt: endOfDay.toISOString()
      }
    });
    
    console.log(`✅ Cleared ${result.deletedCount} transactions from today (${today.toDateString()})`);
    
  } catch (error) {
    console.error('❌ Error clearing transactions:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

clearTodaysTransactions();