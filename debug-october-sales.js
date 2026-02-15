const checkOctoberSales = async () => {
    try {
        console.log("🔍 Debugging October Sales Issue\n");
        
        // Get October data
        const response = await fetch(`http://localhost:3000/api/transaction?dateFilter=month&monthFilter=2025-10&limit=5000`, {
            headers: { "x-api-key": "dev-secret" }
        });
        
        const data = await response.json();
        
        console.log(`📊 October Transactions Found: ${data.length}`);
        
        // Calculate total sales
        let totalSales = 0;
        const duplicateCheck = new Map();
        let duplicates = 0;
        
        data.forEach(transaction => {
            const transId = transaction.transactionId;
            const timestamp = transaction.timestamp;
            const total = parseFloat(transaction.total || 0);
            
            // Check for duplicates by transactionId
            const key = `${transId}-${timestamp}`;
            if (duplicateCheck.has(key)) {
                duplicates++;
                console.log(`🔴 DUPLICATE: TransactionId ${transId}, Timestamp: ${timestamp}, Total: $${total}`);
            } else {
                duplicateCheck.set(key, true);
            }
            
            totalSales += total;
        });
        
        console.log(`\n💰 Current Total Sales: $${totalSales.toFixed(2)}`);
        console.log(`🎯 Expected Total Sales: $51330.76`);
        console.log(`❗ Difference: $${(totalSales - 51330.76).toFixed(2)} too much`);
        console.log(`🔴 Duplicate Transactions Found: ${duplicates}`);
        
        // Check for specific issues
        console.log("\n🔍 Analyzing potential issues:");
        
        // Check for transactions with same transactionId but different timestamps
        const transIdGroups = {};
        data.forEach(transaction => {
            const transId = transaction.transactionId;
            if (!transIdGroups[transId]) {
                transIdGroups[transId] = [];
            }
            transIdGroups[transId].push({
                timestamp: transaction.timestamp,
                total: transaction.total,
                id: transaction._id
            });
        });
        
        let duplicateTransIds = 0;
        Object.entries(transIdGroups).forEach(([transId, transactions]) => {
            if (transactions.length > 1) {
                duplicateTransIds++;
                if (duplicateTransIds <= 5) { // Show first 5 examples
                    console.log(`\n🔴 TransactionId ${transId} appears ${transactions.length} times:`);
                    transactions.forEach((t, index) => {
                        console.log(`   ${index + 1}. ${t.timestamp} - $${t.total} (MongoDB ID: ${t.id})`);
                    });
                }
            }
        });
        
        console.log(`\n📊 Summary:`);
        console.log(`   Total Unique TransactionIDs: ${Object.keys(transIdGroups).length}`);
        console.log(`   TransactionIDs with duplicates: ${duplicateTransIds}`);
        console.log(`   Total Transactions: ${data.length}`);
        
        // Check timestamp ranges
        const timestamps = data.map(t => new Date(t.timestamp)).sort();
        console.log(`   Date Range: ${timestamps[0].toISOString().split('T')[0]} to ${timestamps[timestamps.length-1].toISOString().split('T')[0]}`);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
};

checkOctoberSales();