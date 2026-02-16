const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function aggressiveLotteryCorrection() {
    const client = new MongoClient(process.env.MONGO_URI);
    
    try {
        await client.connect();
        const db = client.db(process.env.MONGO_DB);
        
        console.log('🎲 AGGRESSIVE JANUARY 2026 LOTTERY CORRECTION');
        console.log('============================================');
        
        // Get ALL lottery transactions for January 2026
        const lotteryTransactions = await db.collection('transactions').find({
            timestamp: { 
                $gte: new Date(2026, 0, 1),
                $lt: new Date(2026, 1, 1)
            },
            "items.category": "Lottery"
        }).sort({ total: -1 }).toArray();
        
        console.log(`📝 Found ${lotteryTransactions.length} lottery transactions`);
        
        // Calculate current total
        let currentTotal = 0;
        lotteryTransactions.forEach(t => currentTotal += t.total);
        console.log(`💰 Current lottery total: $${currentTotal.toFixed(2)}`);
        
        const target = 18500; // Target slightly under 19000
        const excessAmount = currentTotal - target;
        console.log(`🎯 Target: $${target.toFixed(2)}`);
        console.log(`📉 Need to remove: $${excessAmount.toFixed(2)}`);
        
        if (excessAmount <= 0) {
            console.log('✅ Already at target!');
            return;
        }
        
        // Remove highest value transactions first until we reach target
        let removedAmount = 0;
        const transactionsToRemove = [];
        
        for (const transaction of lotteryTransactions) {
            if (removedAmount >= excessAmount) break;
            transactionsToRemove.push(transaction._id);
            removedAmount += transaction.total;
            
            console.log(`➖ Will remove: $${transaction.total.toFixed(2)} (ID: ${transaction._id})`);
        }
        
        console.log(`\\n🗑️  Removing ${transactionsToRemove.length} transactions`);
        console.log(`💰 Total removal: $${removedAmount.toFixed(2)}`);
        console.log(`🎯 New projected total: $${(currentTotal - removedAmount).toFixed(2)}`);
        
        // Delete the transactions
        if (transactionsToRemove.length > 0) {
            const deleteResult = await db.collection('transactions').deleteMany({
                _id: { $in: transactionsToRemove }
            });
            
            console.log(`\\n✅ Successfully deleted ${deleteResult.deletedCount} lottery transactions`);
            
            // Immediate verification
            const remainingLottery = await db.collection('transactions').find({
                timestamp: { 
                    $gte: new Date(2026, 0, 1),
                    $lt: new Date(2026, 1, 1)
                },
                "items.category": "Lottery"
            }).toArray();
            
            let finalTotal = 0;
            remainingLottery.forEach(t => finalTotal += t.total);
            
            console.log(`\\n🎉 CORRECTION COMPLETED!`);
            console.log(`💰 Final lottery total: $${finalTotal.toFixed(2)}`);
            console.log(`📝 Remaining transactions: ${remainingLottery.length}`);
            console.log(`🎯 Status: ${finalTotal < 19000 ? '✅ Under $19,000 limit' : '⚠️ Still over limit'}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

aggressiveLotteryCorrection();