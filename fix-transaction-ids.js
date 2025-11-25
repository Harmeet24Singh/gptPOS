const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixTransactionIds() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('gptpos');
    const collection = db.collection('transactions');
    
    // Get all transactions
    const transactions = await collection.find({}).toArray();
    console.log(`Found ${transactions.length} transactions to check`);
    
    let updatedCount = 0;
    
    for (const transaction of transactions) {
      // Update each transaction to ensure it has proper structure
      const updates = {};
      
      // Ensure cashback field exists (set to 0 if missing)
      if (transaction.cashback === undefined || transaction.cashback === null) {
        updates.cashback = 0;
      }
      
      // Only update if there are changes to make
      if (Object.keys(updates).length > 0) {
        await collection.updateOne(
          { _id: transaction._id },
          { $set: updates }
        );
        updatedCount++;
      }
    }
    
    console.log(`✅ Updated ${updatedCount} transactions with missing fields`);
    console.log('All transactions now have proper structure for display');
    
  } catch (error) {
    console.error('❌ Error updating transactions:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

fixTransactionIds();