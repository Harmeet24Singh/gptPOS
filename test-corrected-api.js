const mongo = require('./server/mongo');

async function testCorrectedAPI() {
  try {
    console.log('Testing corrected API date filtering...\n');
    
    // Test the exact API call that would be made
    const transactions = await mongo.getTransactions(1000, 'specific', '2025-11-18');
    
    console.log(`Found ${transactions.length} transactions for Nov 18, 2025`);
    
    if (transactions.length > 0) {
      console.log('\nFirst 5 transactions:');
      transactions.slice(0, 5).forEach((t, i) => {
        const date = new Date(t.timestamp);
        console.log(`${i + 1}. ${date.toLocaleDateString()} ${date.toLocaleTimeString()} - $${t.total} (${t.transactionType})`);
      });
      
      // Calculate total for verification
      let totalSales = 0;
      let cashCount = 0, cardCount = 0, mixedCount = 0, creditCount = 0, lottoCount = 0;
      
      transactions.forEach(t => {
        if (t.transactionType === 'lotto') {
          totalSales -= t.total;
          lottoCount++;
        } else {
          totalSales += t.total;
        }
        
        switch(t.transactionType) {
          case 'cash': cashCount++; break;
          case 'card': cardCount++; break;
          case 'mixed': mixedCount++; break;
          case 'credit': creditCount++; break;
        }
      });
      
      console.log(`\n=== SUMMARY ===`);
      console.log(`Total transactions: ${transactions.length}`);
      console.log(`Net sales: $${totalSales.toFixed(2)}`);
      console.log(`Cash: ${cashCount}, Card: ${cardCount}, Mixed: ${mixedCount}, Credit: ${creditCount}, Lotto: ${lottoCount}`);
      
      // Check date range
      const dates = transactions.map(t => new Date(t.timestamp).toDateString());
      const uniqueDates = [...new Set(dates)];
      console.log(`Date range: ${uniqueDates.join(', ')}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testCorrectedAPI();