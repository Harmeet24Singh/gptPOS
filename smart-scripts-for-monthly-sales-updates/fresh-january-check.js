const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function getCurrentTotals() {
    const client = new MongoClient(process.env.MONGO_URI);
    
    try {
        await client.connect();
        console.log('🔄 Connected to MongoDB...');
        
        const db = client.db(process.env.MONGO_DB);
        
        console.log('📊 JANUARY 2026 CURRENT TOTALS (FRESH DATA)');
        console.log('==========================================');
        
        // Force fresh data by creating new aggregation
        const results = await db.collection('transactions').aggregate([
            {
                $match: {
                    timestamp: { 
                        $gte: new Date(2026, 0, 1),
                        $lt: new Date(2026, 1, 1)
                    }
                }
            },
            {
                $addFields: {
                    category: {
                        $switch: {
                            branches: [
                                {
                                    case: { 
                                        $gt: [
                                            { $size: { $filter: { input: "$items", cond: { $eq: ["$$this.category", "Alcohol"] } } } }, 
                                            0
                                        ] 
                                    },
                                    then: "Alcohol"
                                },
                                {
                                    case: { 
                                        $gt: [
                                            { $size: { $filter: { input: "$items", cond: { $eq: ["$$this.category", "Grocery"] } } } }, 
                                            0
                                        ] 
                                    },
                                    then: "Grocery"
                                },
                                {
                                    case: { 
                                        $gt: [
                                            { $size: { $filter: { input: "$items", cond: { $eq: ["$$this.category", "Tobacco"] } } } }, 
                                            0
                                        ] 
                                    },
                                    then: "Tobacco"
                                }
                            ],
                            default: "Lottery"
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$category",
                    totalAmount: { $sum: "$total" },
                    transactionCount: { $sum: 1 },
                    cashAmount: { 
                        $sum: { 
                            $cond: [{ $eq: ["$paymentMethod", "cash"] }, "$total", 0] 
                        } 
                    },
                    cardAmount: { 
                        $sum: { 
                            $cond: [{ $eq: ["$paymentMethod", "card"] }, "$total", 0] 
                        } 
                    }
                }
            },
            { $sort: { _id: 1 } }
        ], { allowDiskUse: true }).toArray();
        
        console.log('\\n📈 FRESH CATEGORY BREAKDOWN:');
        let totalSales = 0;
        let totalCash = 0;
        let totalCard = 0;
        let totalTransactions = 0;
        
        results.forEach(cat => {
            totalSales += cat.totalAmount;
            totalCash += cat.cashAmount;
            totalCard += cat.cardAmount;
            totalTransactions += cat.transactionCount;
            
            const emoji = getCategoryEmoji(cat._id);
            const status = getTargetStatus(cat._id, cat.totalAmount);
            console.log(`${emoji} ${cat._id}: $${cat.totalAmount.toFixed(2)} (${cat.transactionCount} transactions) ${status}`);
        });
        
        console.log('\\n💰 FRESH OVERALL TOTALS:');
        console.log(`📊 Total Sales: $${totalSales.toFixed(2)}`);
        console.log(`💵 Cash Sales: $${totalCash.toFixed(2)}`);
        console.log(`💳 Card Sales: $${totalCard.toFixed(2)} ${totalCard > 15000 ? '⚠️ OVER LIMIT' : '✅ WITHIN LIMIT'}`);
        console.log(`📝 Total Transactions: ${totalTransactions}`);
        
        console.log('\\n🎯 TARGET SUMMARY:');
        console.log('- Alcohol: $11,000 target');
        console.log('- Grocery: $6,000 target');
        console.log('- Tobacco: $8,000 target');
        console.log('- Lottery: Under $19,000 target');
        console.log('- Card Sales: Under $15,000 limit');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

function getCategoryEmoji(category) {
    const emojis = {
        'Alcohol': '🍺',
        'Grocery': '🛒',
        'Tobacco': '🚬',
        'Lottery': '🎲'
    };
    return emojis[category] || '📦';
}

function getTargetStatus(category, amount) {
    const targets = {
        'Alcohol': 11000,
        'Grocery': 6000,
        'Tobacco': 8000,
        'Lottery': 19000 // This is max, not target
    };
    
    const target = targets[category];
    if (!target) return '';
    
    if (category === 'Lottery') {
        return amount < target ? '✅ Under limit' : '⚠️ Over limit';
    } else {
        const percentage = (amount / target * 100);
        if (percentage >= 95 && percentage <= 105) return '✅ On target';
        if (percentage < 95) return '⚠️ Under target';
        return '⚠️ Over target';
    }
}

getCurrentTotals();