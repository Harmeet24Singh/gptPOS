const analyzeStructure = async () => {
    try {
        console.log("📊 Comparing Data Structure Across Months\n");
        
        const months = [
            { name: "October", filter: "2025-10" },
            { name: "November", filter: "2025-11" }, 
            { name: "December", filter: "2025-12" }
        ];
        
        for (const month of months) {
            const response = await fetch(`http://localhost:3000/api/transaction?dateFilter=month&monthFilter=${month.filter}&limit=1`, {
                headers: { "x-api-key": "dev-secret" }
            });
            
            const data = await response.json();
            
            if (data && data.length > 0) {
                const sample = data[0];
                console.log(`📅 ${month.name} Structure:`);
                console.log(`   transactionId: ${sample.transactionId || 'MISSING'}`);
                console.log(`   timestamp: ${sample.timestamp} (type: ${typeof sample.timestamp})`);
                console.log(`   cashier: ${sample.cashier || 'MISSING'}`);
                console.log(`   paymentMethod: ${sample.paymentMethod}`);
                console.log(`   total: $${sample.total}`);
                
                if (sample.items && sample.items.length > 0) {
                    const item = sample.items[0];
                    console.log(`   Sample item:`);
                    console.log(`     name: ${item.name}`);
                    console.log(`     category: ${item.category}`);
                    console.log(`     barcode: ${item.barcode || 'MISSING'}`);
                    console.log(`     price: $${item.price}`);
                }
                console.log("");
            }
        }
        
        // Check December alcohol specifically
        console.log("🍺 Checking December Alcohol Sales:");
        const decAlcohol = await fetch(`http://localhost:3000/api/transaction?dateFilter=month&monthFilter=2025-12&limit=100`, {
            headers: { "x-api-key": "dev-secret" }
        });
        
        const decData = await decAlcohol.json();
        const alcoholTrans = decData.filter(t => t.items?.some(item => item.category === "Alcohol"));
        
        console.log(`   December alcohol transactions found: ${alcoholTrans.length}`);
        if (alcoholTrans.length > 0) {
            const sample = alcoholTrans[0];
            console.log(`   Sample alcohol transaction:`);
            console.log(`     Timestamp: ${sample.timestamp}`);
            console.log(`     Total: $${sample.total}`);
            console.log(`     Payment: ${sample.paymentMethod}`);
            const alcoholItem = sample.items.find(item => item.category === "Alcohol");
            console.log(`     Alcohol item: ${alcoholItem.name} - $${alcoholItem.price}`);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
};

analyzeStructure();