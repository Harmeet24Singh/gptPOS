// Script to test December alcohol sales visibility
const testDecemberAlcohol = async () => {
    console.log("Testing December 2025 alcohol sales visibility...");
    
    // Test different API endpoints to verify data
    const tests = [
        {
            name: "All December transactions",
            url: "http://localhost:3000/api/transaction?startDate=2025-12-01&endDate=2025-12-31",
        },
        {
            name: "December month filter",
            url: "http://localhost:3000/api/transaction?dateFilter=month&monthFilter=2025-12",
        },
        {
            name: "All transactions (no filter)",
            url: "http://localhost:3000/api/transaction?limit=50000",
        }
    ];
    
    for (const test of tests) {
        try {
            console.log(`\n--- ${test.name} ---`);
            const response = await fetch(test.url, {
                headers: { "x-api-key": "dev-secret" }
            });
            const data = await response.json();
            
            if (Array.isArray(data)) {
                // Filter for alcohol items
                const alcoholTransactions = data.filter(transaction => {
                    if (transaction.items && Array.isArray(transaction.items)) {
                        return transaction.items.some(item => {
                            return item.category === "Alcohol";
                        });
                    }
                    return false;
                });
                
                // Calculate total alcohol sales
                let totalAlcoholSales = 0;
                alcoholTransactions.forEach(transaction => {
                    transaction.items.forEach(item => {
                        if (item.category === "Alcohol") {
                            totalAlcoholSales += item.price * item.quantity;
                        }
                    });
                });
                
                console.log(`Total transactions: ${data.length}`);
                console.log(`Alcohol transactions: ${alcoholTransactions.length}`);
                console.log(`Total alcohol sales: $${totalAlcoholSales.toFixed(2)}`);
                
                // Show sample alcohol transaction
                if (alcoholTransactions.length > 0) {
                    const sample = alcoholTransactions[0];
                    console.log("Sample alcohol transaction:");
                    console.log("- Date:", new Date(sample.timestamp).toISOString().substring(0, 10));
                    console.log("- Total:", sample.total);
                    console.log("- Alcohol items:", sample.items.filter(item => item.category === "Alcohol").map(item => `${item.name} ($${item.price})`));
                }
            } else {
                console.log("Invalid response:", data);
            }
        } catch (error) {
            console.error(`Error testing ${test.name}:`, error);
        }
    }
};

// Run the test
testDecemberAlcohol();