const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkActualMarchLottery() {
    const client = new MongoClient(process.env.MONGO_URI);
    
    try {
        await client.connect();
        const db = client.db(process.env.MONGO_DB);
        
        console.log("🔍 CHECKING ACTUAL MARCH 2025 LOTTERY SALES\n");
        
        // Method 1: Direct aggregation by items.category
        const method1 = await db.collection('transactions').aggregate([
            {
                $match: {
                    timestamp: { $gte: new Date(2025, 2, 1), $lt: new Date(2025, 3, 1) }
                }
            },
            {
                $unwind: "$items"
            },
            {
                $match: { "items.category": "Lottery" }
            },
            {
                $group: {
                    _id: "Lottery",
                    totalSales: { $sum: "$total" },
                    transactionCount: { $sum: 1 }
                }
            }
        ]).toArray();
        
        console.log("Method 1 - Aggregation by items.category:");
        if (method1.length > 0) {
            console.log(`   Total: $${method1[0].totalSales.toFixed(2)}`);
            console.log(`   Transactions: ${method1[0].transactionCount}`);
        } else {
            console.log("   No lottery transactions found");
        }
        
        // Method 2: Count transactions that contain lottery items
        const method2 = await db.collection('transactions').find({
            timestamp: { $gte: new Date(2025, 2, 1), $lt: new Date(2025, 3, 1) },
            "items.category": "Lottery"
        }).toArray();
        
        let totalSalesMethod2 = 0;
        method2.forEach(t => {
            totalSalesMethod2 += t.total;
        });
        
        console.log("\nMethod 2 - Transaction totals with lottery items:");
        console.log(`   Total: $${totalSalesMethod2.toFixed(2)}`);
        console.log(`   Transactions: ${method2.length}`);
        
        // Method 3: Check what your frontend might be calculating
        const method3 = await db.collection('transactions').aggregate([
            {
                $match: {
                    timestamp: { $gte: new Date(2025, 2, 1), $lt: new Date(2025, 3, 1) },
                    "items.category": "Lottery"
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$total" },
                    transactionCount: { $sum: 1 }
                }
            }
        ]).toArray();
        
        console.log("\nMethod 3 - Direct transaction aggregation (likely frontend method):");
        if (method3.length > 0) {
            console.log(`   Total: $${method3[0].totalSales.toFixed(2)}`);
            console.log(`   Transactions: ${method3[0].transactionCount}`);
        } else {
            console.log("   No lottery transactions found");
        }
        
        // Check if there are mixed-category transactions
        console.log("\n🔍 Checking for mixed-category transactions:");
        const mixedTransactions = await db.collection('transactions').find({
            timestamp: { $gte: new Date(2025, 2, 1), $lt: new Date(2025, 3, 1) },
            "items.category": "Lottery"
        }).limit(5).toArray();
        
        mixedTransactions.forEach((t, i) => {
            const categories = [...new Set(t.items.map(item => item.category))];
            console.log(`   Transaction ${i+1}: $${t.total}, categories: ${categories.join(', ')}`);
        });
        
        // All categories for March
        console.log("\n📊 ALL MARCH 2025 CATEGORY TOTALS:");
        const allCategories = await db.collection('transactions').aggregate([
            {
                $match: {
                    timestamp: { $gte: new Date(2025, 2, 1), $lt: new Date(2025, 3, 1) }
                }
            },
            {
                $unwind: "$items"
            },
            {
                $group: {
                    _id: "$items.category",
                    totalSales: { $sum: "$total" },
                    transactionCount: { $sum: 1 }
                }
            },
            { $sort: { totalSales: -1 } }
        ]).toArray();
        
        allCategories.forEach(cat => {
            console.log(`   ${cat._id}: $${cat.totalSales.toFixed(2)} (${cat.transactionCount} transactions)`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkActualMarchLottery();