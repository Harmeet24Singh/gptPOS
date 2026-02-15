const testUpdatedData = async () => {
    try {
        console.log("🔍 Testing Updated December Data...\n");
        
        // Get latest transactions by timestamp 
        const response = await fetch(`http://localhost:3000/api/transaction?dateFilter=month&monthFilter=2025-12&limit=10&sortBy=timestamp&sortOrder=desc`, {
            headers: { "x-api-key": "dev-secret" }
        });
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            console.log(`Found ${data.length} recent December transactions:`);
            
            data.forEach((transaction, index) => {
                console.log(`\n${index + 1}. Transaction:`);
                console.log(`   ID: ${transaction.transactionId || 'MISSING'}`);
                console.log(`   Timestamp: ${transaction.timestamp}`);
                console.log(`   Cashier: ${transaction.cashier || 'MISSING'}`);
                console.log(`   Payment: ${transaction.paymentMethod || 'MISSING'}`);
                console.log(`   Total: $${transaction.total}`);
                
                if (transaction.items && transaction.items.length > 0) {
                    transaction.items.forEach(item => {
                        console.log(`   Item: ${item.name} (${item.category}) - $${item.price} [${item.barcode || 'NO BARCODE'}]`);
                    });
                }
            });
        }
        
        // Also check for alcohol specifically
        console.log("\n\n🍺 Checking Alcohol Sales in December:");
        const alcoholResponse = await fetch(`http://localhost:3000/api/transaction?dateFilter=month&monthFilter=2025-12&category=Alcohol&limit=5`, {
            headers: { "x-api-key": "dev-secret" }
        });
        
        const alcoholData = await alcoholResponse.json();
        
        if (Array.isArray(alcoholData)) {
            console.log(`Found ${alcoholData.length} alcohol transactions in December`);
            
            alcoholData.forEach((transaction, index) => {
                const alcoholItems = transaction.items.filter(item => item.category === "Alcohol");
                console.log(`\n${index + 1}. Alcohol Transaction (ID: ${transaction.transactionId}):`);
                alcoholItems.forEach(item => {
                    console.log(`   ${item.name} - $${item.price} [${item.barcode || 'NO BARCODE'}]`);
                });
            });
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
};

testUpdatedData();