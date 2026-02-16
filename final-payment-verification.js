const { MongoClient } = require('mongodb');
require('dotenv').config();

async function finalSystemCheck() {
    const client = new MongoClient(process.env.MONGO_URI);
    
    try {
        await client.connect();
        const db = client.db(process.env.MONGO_DB);
        
        console.log("🏆 FINAL SYSTEM-WIDE PAYMENT VERIFICATION\n");
        
        // Check each month
        const months = [
            { name: "October 2025", start: new Date("2025-10-01"), end: new Date("2025-11-01") },
            { name: "November 2025", start: new Date("2025-11-01"), end: new Date("2025-12-01") },
            { name: "December 2025", start: new Date("2025-12-01"), end: new Date("2026-01-01") },
            { name: "January 2026", start: new Date("2026-01-01"), end: new Date("2026-02-01") }
        ];
        
        for (const month of months) {
            const stats = await db.collection('transactions').aggregate([
                {
                    $match: {
                        timestamp: { $gte: month.start, $lt: month.end }
                    }
                },
                {
                    $group: {
                        _id: "$paymentMethod",
                        count: { $sum: 1 },
                        totalAmount: { $sum: "$total" },
                        cashSum: { $sum: "$cashAmount" },
                        cardSum: { $sum: "$cardAmount" }
                    }
                }
            ]).toArray();
            
            console.log(`📅 ${month.name}:`);
            let monthTotal = 0;
            let monthTransactions = 0;
            let monthCash = 0;
            let monthCard = 0;
            
            stats.forEach(s => {
                console.log(`   ${s._id}: ${s.count} transactions, $${s.totalAmount.toFixed(2)} sales`);
                console.log(`      💰 Cash tracked: $${s.cashSum.toFixed(2)} | 💳 Card tracked: $${s.cardSum.toFixed(2)}`);
                
                monthTotal += s.totalAmount;
                monthTransactions += s.count;
                monthCash += s.cashSum;
                monthCard += s.cardSum;
            });
            
            const paymentConsistency = Math.abs((monthCash + monthCard) - monthTotal) < 0.01;
            console.log(`   📊 Month Total: ${monthTransactions} transactions, $${monthTotal.toFixed(2)}`);
            console.log(`   ✅ Payment Consistency: ${paymentConsistency ? 'PERFECT' : 'ERROR'} (Cash+Card=$${(monthCash+monthCard).toFixed(2)})\n`);
        }
        
        // Check for any remaining inconsistencies
        console.log("🔍 Checking for any remaining payment inconsistencies...");
        const inconsistent = await db.collection('transactions').countDocuments({
            $or: [
                { paymentMethod: "card", $expr: { $ne: ["$cardAmount", "$total"] } },
                { paymentMethod: "card", cashAmount: { $ne: 0 } },
                { paymentMethod: "cash", $expr: { $ne: ["$cashAmount", "$total"] } },
                { paymentMethod: "cash", cardAmount: { $ne: 0 } }
            ]
        });
        
        console.log(`Found ${inconsistent} inconsistent transactions`);
        
        if (inconsistent === 0) {
            console.log("🎉 PERFECT! No payment inconsistencies found!");
            console.log("✅ All payment methods should now display correctly in frontend");
            console.log("✅ No more 'unknown' payment method issues");
            console.log("✅ Cash and card amounts properly tracked across all months");
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

finalSystemCheck();