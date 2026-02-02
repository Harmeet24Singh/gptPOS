// This script will help check localStorage transactions
// Run this in the browser console on the transactions page

console.log('📱 Checking localStorage transactions...');

// Get transactions from localStorage
const savedTransactions = JSON.parse(localStorage.getItem("transactions") || "[]");
console.log(`📊 Total transactions in localStorage: ${savedTransactions.length}`);

// Get today's date
const today = new Date().toDateString();
console.log(`🗓️ Today's date: ${today}`);

// Filter today's transactions
const todaysTransactions = savedTransactions.filter(
  t => new Date(t.timestamp).toDateString() === today
);

console.log(`📊 Found ${todaysTransactions.length} transactions for today:`);

let totalSales = 0;

todaysTransactions.forEach((transaction, index) => {
  const transactionTotal = transaction.total || 0;
  totalSales += transactionTotal;
  
  console.log(`\n${index + 1}. Transaction:`, {
    id: transaction.id || transaction._id,
    total: `$${transactionTotal.toFixed(2)}`,
    time: new Date(transaction.timestamp).toLocaleString(),
    items: transaction.items ? transaction.items.length : 0,
    type: transaction.transactionType || 'N/A',
    payment: transaction.paymentMethod || 'N/A'
  });
  
  if (transaction.items && transaction.items.length > 0) {
    console.log('   Items:');
    transaction.items.forEach((item, itemIndex) => {
      console.log(`      ${itemIndex + 1}. ${item.name} - Qty: ${item.quantity} x $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}`);
    });
  }
});

console.log(`\n💰 Total Sales Today: $${totalSales.toFixed(2)}`);
console.log(`🎯 Expected: $110.96`);
console.log(`✅ Match: ${totalSales.toFixed(2) === '110.96' ? 'YES' : 'NO'}`);

// Also check if there are any today's transactions with different date formats
console.log('\n🔍 Checking all transactions timestamps:');
savedTransactions.forEach((tx, i) => {
  const txDate = new Date(tx.timestamp);
  const isToday = txDate.toDateString() === today;
  if (isToday) {
    console.log(`Found today's transaction #${i + 1}:`, {
      timestamp: tx.timestamp,
      date: txDate.toDateString(),
      total: tx.total
    });
  }
});

// Export for manual inspection
window.todaysTransactions = todaysTransactions;
window.allTransactions = savedTransactions;
console.log('\n💾 Data exported to window.todaysTransactions and window.allTransactions for inspection');