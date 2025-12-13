// Quick test script to add alcohol transactions for testing
const { MongoClient } = require('mongodb');

async function addTestAlcoholTransactions() {
  const client = new MongoClient('mongodb+srv://harmeet4441:nvgCCROJJ0u6bRmV@cluster0.7gckypy.mongodb.net/gptPos');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('gptPos');
    const collection = db.collection('transactions');
    
    // Test transaction with Alcohol category
    const testTransaction1 = {
      id: 'TEST_ALCOHOL_' + Date.now(),
      timestamp: new Date(),
      items: [
        {
          name: 'Bud Light Beer',
          price: 12.99,
          quantity: 1,
          category: 'Alcohol'
        },
        {
          name: 'Chips',
          price: 3.50,
          quantity: 1,
          category: 'Snacks'
        }
      ],
      total: 16.49,
      paymentBreakdown: [
        { method: 'cash', amount: 16.49 }
      ],
      transactionType: 'sale',
      cashier: 'test'
    };
    
    // Test transaction with alcohol name pattern (no category)
    const testTransaction2 = {
      id: 'TEST_BEER_' + Date.now(),
      timestamp: new Date(),
      items: [
        {
          name: 'Blue Labatt',
          price: 15.99,
          quantity: 2,
          // No category - should be detected by name
        },
        {
          name: 'Milk',
          price: 4.99,
          quantity: 1,
          category: 'Dairy'
        }
      ],
      total: 36.97,
      paymentBreakdown: [
        { method: 'cash', amount: 36.97 }
      ],
      transactionType: 'sale',
      cashier: 'test'
    };
    
    const result = await collection.insertMany([testTransaction1, testTransaction2]);
    console.log('Inserted test alcohol transactions:', result.insertedIds);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

addTestAlcoholTransactions();