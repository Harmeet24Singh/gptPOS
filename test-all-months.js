const testAllMonths = async () => {
    const months = [
        { name: "October 2025", filter: "2025-10" },
        { name: "November 2025", filter: "2025-11" }, 
        { name: "December 2025", filter: "2025-12" }
    ];
    
    console.log("🧪 Testing Month Filters...\n");
    
    for (const month of months) {
        try {
            const response = await fetch(`http://localhost:3000/api/transaction?dateFilter=month&monthFilter=${month.filter}&limit=10`, {
                headers: { "x-api-key": "dev-secret" }
            });
            
            const data = await response.json();
            
            if (Array.isArray(data)) {
                const alcoholCount = data.filter(t => t.items?.some(item => item.category === "Alcohol")).length;
                const groceryCount = data.filter(t => t.items?.some(item => item.category === "Grocery")).length;
                
                console.log(`📅 ${month.name}:`);
                console.log(`   Total transactions: ${data.length}`);
                console.log(`   Alcohol: ${alcoholCount}`);
                console.log(`   Grocery: ${groceryCount}`);
                
                if (data.length > 0) {
                    const sample = data[0];
                    console.log(`   Sample timestamp: ${sample.timestamp}`);
                    console.log(`   Sample cashier: ${sample.cashier}`);
                    console.log(`   Has transactionId: ${!!sample.transactionId}`);
                }
                console.log("");
            } else {
                console.log(`❌ ${month.name}: Invalid response`);
            }
        } catch (error) {
            console.log(`❌ ${month.name}: Error - ${error.message}`);
        }
    }
};

testAllMonths();