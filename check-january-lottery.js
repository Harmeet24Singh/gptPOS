const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkJanuaryLottery() {
    const client = new MongoClient(process.env.MONGO_URI);
    
    try {
        await client.connect();
        const db = client.db(process.env.MONGO_DB);
        
        // Check January 2026 lottery sales
        const lotteryResults = await db.collection('transactions').aggregate([
            {
                $match: {
                    timestamp: { 
                        $gte: new Date(2026, 0, 1),  // January 1, 2026
                        $lt: new Date(2026, 1, 1)    // February 1, 2026
                    }
                }
            },
            {
                $unwind: "$items"
            },
            {
                $match: {
                    $or: [
                        { "items.category": "Lottery" },
                        { "items.category": "Lotto" },
                        { "items.name": { $regex: /lottery|lotto|scratch|ticket/i } }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                    transactionCount: { $addToSet: "$_id" }
                }
            },
            {
                $project: {
                    totalAmount: 1,
                    transactionCount: { $size: "$transactionCount" }
                }
            }
        ]).toArray();
        
        // Also check transaction-level totals
        const transactionTotals = await db.collection('transactions').aggregate([
            {
                $match: {
                    timestamp: { 
                        $gte: new Date(2026, 0, 1),  
                        $lt: new Date(2026, 1, 1)    
                    }
                }
            },
            {
                $match: {
                    "items.category": { $in: ["Lottery", "Lotto"] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$total" },
                    transactionCount: { $sum: 1 }
                }
            }
        ]).toArray();
        
        console.log('🎲 January 2026 Lottery Sales Analysis');
        console.log('=====================================');
        
        if (lotteryResults[0]) {
            console.log(`💰 Item-level calculation: $${lotteryResults[0].totalAmount.toFixed(2)}`);
            console.log(`📝 Lottery transactions: ${lotteryResults[0].transactionCount}`);
        } else {
            console.log('📝 No lottery items found');
        }
        
        if (transactionTotals[0]) {
            console.log(`💰 Transaction-level total: $${transactionTotals[0].totalAmount.toFixed(2)}`);
            console.log(`📝 Transaction count: ${transactionTotals[0].transactionCount}`);
        } else {
            console.log('📝 No lottery transactions found');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkJanuaryLottery();