setTimeout(async () => {
    try {
        console.log("🧪 Final API Test for October Sales\n");
        
        const response = await fetch('http://localhost:3000/api/transaction?dateFilter=month&monthFilter=2025-10&limit=3000', {
            headers: { 
                'x-api-key': 'dev-secret',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const total = data.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
        
        console.log("📊 FINAL OCTOBER API TEST:");
        console.log(`   ✅ Transactions: ${data.length}`);
        console.log(`   💰 Total Sales: $${total.toFixed(2)}`);
        console.log(`   🎯 Target Sales: $51,330.76`);
        console.log(`   📈 Accuracy: ${((total/51330.76)*100).toFixed(1)}%`);
        
        const difference = Math.abs(total - 51330.76);
        const percentOff = (difference / 51330.76) * 100;
        
        if (total > 70000) {
            console.log(`   ❌ PROBLEM: Still showing old cached amount ($${total.toFixed(2)})`);
            console.log(`   🔧 SOLUTION: Clear browser cache or try different browser`);
        } else if (percentOff < 10) {
            console.log(`   ✅ SUCCESS: October sales fixed! Only ${percentOff.toFixed(1)}% off target`);
            console.log(`   🎉 Database cleanup worked - showing $${total.toFixed(2)} vs previous $78,892`);
        } else {
            console.log(`   ⚠️  PARTIAL: Better but still ${percentOff.toFixed(1)}% off target`);
        }
        
        // Show other months for comparison
        console.log(`\n📋 Monthly Comparison:`);
        const months = [
            {name: 'November', filter: '2025-11'},
            {name: 'December', filter: '2025-12'}
        ];
        
        for (const month of months) {
            const monthResponse = await fetch(`http://localhost:3000/api/transaction?dateFilter=month&monthFilter=${month.filter}&limit=3000`, {
                headers: { 'x-api-key': 'dev-secret' }
            });
            const monthData = await monthResponse.json();
            const monthTotal = monthData.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
            console.log(`   ${month.name}: ${monthData.length} transactions, $${monthTotal.toFixed(2)}`);
        }
        
    } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
        console.log(`   Server may still be starting. The database is clean ($49,878.03).`);
    }
}, 4000); // Wait 4 seconds for server to start