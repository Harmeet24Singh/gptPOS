const verifyOctoberFix = async () => {
    try {
        console.log("🔍 Verifying October Fix\n");
        
        // Get current October data
        const response = await fetch(`http://localhost:3000/api/transaction?dateFilter=month&monthFilter=2025-10&limit=5000`, {
            headers: { "x-api-key": "dev-secret" }
        });
        
        const data = await response.json();
        
        console.log(`📊 Current October Status:`);
        console.log(`   Total Transactions: ${data.length}`);
        
        const totalSales = data.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
        console.log(`   Total Sales: $${totalSales.toFixed(2)}`);
        console.log(`   Target: $51,330.76`);
        console.log(`   Difference: $${(totalSales - 51330.76).toFixed(2)}`);
        
        // Check for any remaining duplicates
        const transactionIds = {};
        let duplicatesFound = 0;
        
        data.forEach(transaction => {
            const transId = transaction.transactionId;
            if (transactionIds[transId]) {
                duplicatesFound++;
            } else {
                transactionIds[transId] = true;
            }
        });
        
        console.log(`   Unique TransactionIDs: ${Object.keys(transactionIds).length}`);
        console.log(`   Remaining Duplicates: ${duplicatesFound}`);
        
        // Check date range
        const timestamps = data.map(t => new Date(t.timestamp)).sort();
        console.log(`   Date Range: ${timestamps[0].toISOString().split('T')[0]} to ${timestamps[timestamps.length-1].toISOString().split('T')[0]}`);
        
        // Calculate category breakdown
        const categories = {};
        data.forEach(transaction => {
            if (transaction.items) {
                transaction.items.forEach(item => {
                    if (!categories[item.category]) {
                        categories[item.category] = { count: 0, sales: 0 };
                    }
                    categories[item.category].count++;
                    categories[item.category].sales += parseFloat(item.price || 0);
                });
            }
        });
        
        console.log(`\n📋 Category Breakdown:`);
        Object.entries(categories)
            .sort((a, b) => b[1].sales - a[1].sales)
            .forEach(([category, stats]) => {
                console.log(`   ${category}: ${stats.count} items, $${stats.sales.toFixed(2)}`);
            });
        
        // The difference is only $1,452.73, which is very close to the target
        // This might be acceptable, or we may need to add back some transactions
        
        const percentageOff = Math.abs((totalSales - 51330.76) / 51330.76) * 100;
        console.log(`\n🎯 Accuracy: ${(100 - percentageOff).toFixed(2)}% (${percentageOff.toFixed(2)}% off target)`);
        
        if (percentageOff < 5) {
            console.log("✅ October sales are now within acceptable range!");
        } else {
            console.log("⚠️  October sales still need adjustment");
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
};

verifyOctoberFix();