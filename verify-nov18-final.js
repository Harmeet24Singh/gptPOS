const { MongoClient } = require('mongodb');

const url = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB || 'convenience_store';

async function verifyNov18Transactions() {
  const client = new MongoClient(url);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection('transactions');
    
    // Get all Nov 18 transactions
    const startDate = new Date('2025-11-18T00:00:00.000Z');
    const endDate = new Date('2025-11-19T00:00:00.000Z');
    
    const transactions = await collection.find({
      timestamp: {
        $gte: startDate,
        $lt: endDate
      }
    }).sort({ timestamp: 1 }).toArray();
    
    console.log(`\n=== NOVEMBER 18, 2025 TRANSACTION VERIFICATION ===`);
    console.log(`Total transactions found: ${transactions.length}`);
    
    if (transactions.length > 0) {
      // Show date range of transactions
      const firstTransaction = new Date(transactions[0].timestamp);
      const lastTransaction = new Date(transactions[transactions.length - 1].timestamp);
      
      console.log(`First transaction: ${firstTransaction.toString()}`);
      console.log(`Last transaction: ${lastTransaction.toString()}`);
      
      // Calculate totals by type
      const breakdown = {
        cash: { count: 0, total: 0 },
        card: { count: 0, total: 0 },
        mixed: { count: 0, total: 0 },
        credit: { count: 0, total: 0 },
        lotto: { count: 0, total: 0 }
      };
      
      let netSales = 0;
      
      transactions.forEach(t => {
        if (breakdown[t.transactionType]) {
          breakdown[t.transactionType].count++;
          breakdown[t.transactionType].total += t.total;
          
          if (t.transactionType === 'lotto') {
            netSales -= t.total; // Lotto payouts reduce net sales
          } else {
            netSales += t.total;
          }
        }
      });
      
      console.log(`\n=== BREAKDOWN BY PAYMENT TYPE ===`);
      Object.keys(breakdown).forEach(type => {
        const data = breakdown[type];
        if (data.count > 0) {
          console.log(`${type.toUpperCase()}: ${data.count} transactions, $${data.total.toFixed(2)}`);
        }
      });
      
      console.log(`\n=== TOTALS ===`);
      console.log(`Gross sales (excluding lotto): $${(netSales + breakdown.lotto.total).toFixed(2)}`);
      console.log(`Lotto payouts: $${breakdown.lotto.total.toFixed(2)}`);
      console.log(`Net sales: $${netSales.toFixed(2)}`);
      
      // Show hourly distribution
      const hourlyTotals = {};
      transactions.forEach(t => {
        const hour = new Date(t.timestamp).getHours();
        if (!hourlyTotals[hour]) hourlyTotals[hour] = { count: 0, sales: 0 };
        hourlyTotals[hour].count++;
        if (t.transactionType === 'lotto') {
          hourlyTotals[hour].sales -= t.total;
        } else {
          hourlyTotals[hour].sales += t.total;
        }
      });
      
      console.log(`\n=== HOURLY DISTRIBUTION ===`);
      Object.keys(hourlyTotals).sort((a, b) => parseInt(a) - parseInt(b)).forEach(hour => {
        const data = hourlyTotals[hour];
        console.log(`${hour.padStart(2, '0')}:00 - ${data.count} transactions, $${data.sales.toFixed(2)}`);
      });
      
      // Check for any timestamp issues
      const nonNov18 = transactions.filter(t => {
        const date = new Date(t.timestamp);
        return date.getDate() !== 18 || date.getMonth() !== 10 || date.getFullYear() !== 2025;
      });
      
      if (nonNov18.length > 0) {
        console.log(`\n⚠️  WARNING: ${nonNov18.length} transactions have incorrect dates!`);
        nonNov18.slice(0, 5).forEach((t, i) => {
          console.log(`${i + 1}. ${new Date(t.timestamp).toString()} - $${t.total}`);
        });
      } else {
        console.log(`\n✅ All transactions are correctly timestamped for November 18, 2025`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

verifyNov18Transactions();