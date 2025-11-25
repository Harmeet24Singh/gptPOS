const mongo = require('./server/mongo');

async function debugTransaction() {
  try {
    console.log('Fetching transactions from database...');
    const transactions = await mongo.getTransactions(10);
    
    console.log(`Found ${transactions.length} transactions`);
    
    transactions.forEach((tx, index) => {
      console.log(`\n--- Transaction ${index + 1} ---`);
      console.log('ID:', tx.id || tx._id);
      console.log('Timestamp:', tx.timestamp);
      console.log('Total:', tx.total);
      console.log('Items array exists:', !!tx.items);
      console.log('Items is array:', Array.isArray(tx.items));
      console.log('Items length:', tx.items ? tx.items.length : 'N/A');
      
      if (tx.items && tx.items.length > 0) {
        console.log('First item structure:', tx.items[0]);
      }
      
      // Check if this is the problematic transaction
      const shortId = (tx.id || tx._id || '').toString().slice(-8);
      if (shortId === '4cefa6aa') {
        console.log('\n🔍 FOUND PROBLEMATIC TRANSACTION:');
        console.log('Full transaction object:');
        console.log(JSON.stringify(tx, null, 2));
      }
    });
    
  } catch (error) {
    console.error('Error debugging transactions:', error);
  }
  
  process.exit(0);
}

debugTransaction();