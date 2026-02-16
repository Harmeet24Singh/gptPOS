const { MongoClient } = require('mongodb');
require('dotenv').config();

async function verifyJanuaryAlcohol() {
    const client = new MongoClient(process.env.MONGO_URI);
    
    try {
        await client.connect();
        const db = client.db(process.env.MONGO_DB);
        
        console.log("🍺 JANUARY ALCOHOL SALES VERIFICATION\n");
        
        // Check payment method distribution
        const paymentBreakdown = await db.collection('transactions').aggregate([
            {
                $match: {
                    timestamp: { $gte: new Date("2026-01-01"), $lt: new Date("2026-02-01") },
                    "items.category": "Alcohol"
                }
            },
            {
                $group: {
                    _id: "$paymentMethod",
                    count: { $sum: 1 },
                    total: { $sum: "$total" },
                    avgAmount: { $avg: "$total" }
                }
            },
            { $sort: { total: -1 } }
        ]).toArray();
        
        console.log("💳 Payment Method Breakdown:");
        let totalTransactions = 0;
        let totalSales = 0;
        
        paymentBreakdown.forEach(p => {
            console.log(`   ${p._id}: ${p.count} transactions, $${p.total.toFixed(2)} total, $${p.avgAmount.toFixed(2)} avg`);
            totalTransactions += p.count;
            totalSales += p.total;
        });
        
        console.log(`\n📊 Total January Alcohol: ${totalTransactions} transactions, $${totalSales.toFixed(2)}\n`);
        
        // Check a few sample transactions
        console.log("🔍 Sample January Alcohol Transactions:");
        const samples = await db.collection('transactions').find({
            timestamp: { $gte: new Date("2026-01-01"), $lt: new Date("2026-02-01") },
            "items.category": "Alcohol"
        }).limit(5).toArray();
        
        samples.forEach((t, i) => {
            console.log(`   ${i+1}. ID ${t.transactionId} (${t.paymentMethod}):`);
            console.log(`      Total: $${t.total} | Cash: $${t.cashAmount} | Card: $${t.cardAmount}`);
            console.log(`      Items: ${t.items.map(item => `${item.name} ($${item.price})`).join(', ')}`);
            
            // Verify payment consistency
            const expectedCash = t.paymentMethod === 'cash' ? t.total : 0;
            const expectedCard = t.paymentMethod === 'card' ? t.total : 0;
            const isConsistent = t.cashAmount === expectedCash && t.cardAmount === expectedCard;
            console.log(`      ✅ Payment consistency: ${isConsistent ? 'CORRECT' : 'ERROR'}\n`);
        });
        
        // Check if payment methods show up correctly for frontend
        console.log("🎯 Frontend Display Check:");
        console.log("   - All transactions should have paymentMethod as string ('cash' or 'card')");
        console.log("   - Cash transactions should have cashAmount = total, cardAmount = 0");
        console.log("   - Card transactions should have cardAmount = total, cashAmount = 0");
        console.log("   - This should eliminate 'unknown' payment method display\n");
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

verifyJanuaryAlcohol();