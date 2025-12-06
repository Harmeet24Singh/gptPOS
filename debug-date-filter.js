const { MongoClient } = require('mongodb');

const url = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB || 'convenience_store';

async function debugDateFilter() {
  const client = new MongoClient(url);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection('transactions');
    
    // Test the exact same filter logic as the API
    const dateFilter = 'specific';
    const selectedDate = '2025-11-18';
    
    console.log('Input parameters:');
    console.log('dateFilter:', dateFilter);
    console.log('selectedDate:', selectedDate);
    
    // Replicate the API logic exactly
    let dateQuery = {};
    
    if (dateFilter && dateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dateFilter === 'specific' && selectedDate) {
        const specDate = new Date(selectedDate);
        specDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(specDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        console.log('Parsed specDate:', specDate);
        console.log('Next day:', nextDay);
        
        dateQuery = {
          timestamp: {
            $gte: specDate,
            $lt: nextDay
          }
        };
      }
    }
    
    console.log('Date query:', JSON.stringify(dateQuery, null, 2));
    
    // Test the query
    const transactions = await collection.find(dateQuery).limit(10).toArray();
    
    console.log(`\nFound ${transactions.length} transactions`);
    
    if (transactions.length > 0) {
      console.log('\nFirst few transactions:');
      transactions.slice(0, 3).forEach((t, i) => {
        console.log(`${i + 1}. ${new Date(t.timestamp).toString()} - $${t.total}`);
      });
    }
    
    // Also test with different date formats
    console.log('\n=== Testing different date formats ===');
    
    const testDates = [
      '2025-11-18',
      '2025-11-18T00:00:00.000Z',
      '2025-11-18T00:00:00',
      'November 18, 2025',
      '11/18/2025'
    ];
    
    for (const testDate of testDates) {
      try {
        const testSpecDate = new Date(testDate);
        testSpecDate.setHours(0, 0, 0, 0);
        const testNextDay = new Date(testSpecDate);
        testNextDay.setDate(testNextDay.getDate() + 1);
        
        const testQuery = {
          timestamp: {
            $gte: testSpecDate,
            $lt: testNextDay
          }
        };
        
        const count = await collection.countDocuments(testQuery);
        console.log(`Date: ${testDate} -> Parsed: ${testSpecDate.toISOString()} -> Count: ${count}`);
      } catch (error) {
        console.log(`Date: ${testDate} -> ERROR: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

debugDateFilter();