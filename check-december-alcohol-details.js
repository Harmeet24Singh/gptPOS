const checkSpecificAlcohol = async () => {
    try {
        // Get all December transactions and manually filter for alcohol
        const response = await fetch(`http://localhost:3000/api/transaction?dateFilter=month&monthFilter=2025-12&limit=2000`, {
            headers: { "x-api-key": "dev-secret" }
        });
        
        const allData = await response.json();
        
        console.log(`📊 Total December transactions: ${allData.length}`);
        
        // Manually find alcohol transactions
        const alcoholTransactions = allData.filter(transaction => 
            transaction.items && transaction.items.some(item => item.category === "Alcohol")
        );
        
        console.log(`🍺 Alcohol transactions found: ${alcoholTransactions.length}\n`);
        
        if (alcoholTransactions.length > 0) {
            console.log("📋 First 3 Alcohol Transactions:");
            alcoholTransactions.slice(0, 3).forEach((transaction, index) => {
                console.log(`\n${index + 1}. Transaction ID: ${transaction.transactionId}`);
                console.log(`   Timestamp: ${transaction.timestamp}`);
                console.log(`   Payment: ${transaction.paymentMethod}`);
                console.log(`   Total: $${transaction.total}`);
                console.log(`   Alcohol Items:`);
                
                const alcoholItems = transaction.items.filter(item => item.category === "Alcohol");
                alcoholItems.forEach(item => {
                    console.log(`     - ${item.name}: $${item.price} [${item.barcode}]`);
                });
                
                const otherItems = transaction.items.filter(item => item.category !== "Alcohol");
                if (otherItems.length > 0) {
                    console.log(`   Other Items:`);
                    otherItems.forEach(item => {
                        console.log(`     - ${item.name} (${item.category}): $${item.price}`);
                    });
                }
            });
            
            // Calculate alcohol sales total
            let alcoholTotal = 0;
            alcoholTransactions.forEach(transaction => {
                const alcoholItems = transaction.items.filter(item => item.category === "Alcohol");
                alcoholItems.forEach(item => {
                    alcoholTotal += parseFloat(item.price);
                });
            });
            
            console.log(`\n💰 Total December Alcohol Sales: $${alcoholTotal.toFixed(2)}`);
            
        } else {
            console.log("❌ No alcohol transactions found in December");
            
            // Check what categories exist
            const categories = new Set();
            allData.forEach(transaction => {
                if (transaction.items) {
                    transaction.items.forEach(item => {
                        categories.add(item.category);
                    });
                }
            });
            
            console.log("\n📝 Available categories in December:");
            Array.from(categories).sort().forEach(category => {
                const count = allData.filter(t => 
                    t.items && t.items.some(item => item.category === category)
                ).length;
                console.log(`   ${category}: ${count} transactions`);
            });
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
};

checkSpecificAlcohol();