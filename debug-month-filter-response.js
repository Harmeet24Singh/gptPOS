// Debug what's returned by month filter
const debugMonthFilter = async () => {
    try {
        const response = await fetch("http://localhost:3000/api/transaction?dateFilter=month&monthFilter=2025-12", {
            headers: { "x-api-key": "dev-secret" }
        });
        const data = await response.json();
        
        console.log("Total transactions:", data.length);
        
        if (data.length > 0) {
            // Look at first few transactions
            console.log("\nFirst transaction structure:");
            console.log(JSON.stringify(data[0], null, 2));
            
            // Check if transactions have items
            let hasItems = 0;
            let hasAlcoholItems = 0;
            
            data.forEach((transaction, index) => {
                if (transaction.items && Array.isArray(transaction.items)) {
                    hasItems++;
                    const alcoholItems = transaction.items.filter(item => item.category === "Alcohol");
                    if (alcoholItems.length > 0) {
                        hasAlcoholItems++;
                        if (hasAlcoholItems <= 3) { // Show first 3
                            console.log(`\nTransaction ${index} has alcohol:`, alcoholItems.map(item => item.name));
                        }
                    }
                }
            });
            
            console.log(`\nTransactions with items: ${hasItems}`);
            console.log(`Transactions with alcohol items: ${hasAlcoholItems}`);
        }
    } catch (error) {
        console.error("Error:", error);
    }
};

debugMonthFilter();