const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function debugMarch2025Issues() {
    const client = new MongoClient(process.env.MONGO_URI);
    
    try {
        await client.connect();
        const db = client.db(process.env.MONGO_DB);
        
        console.log("🔍 DEBUGGING MARCH 2025 PAYMENT METHOD & NaN ISSUES\n");
        
        // 1. Check payment method structure of March 2025 transactions
        console.log("1️⃣ Payment Method Structure Check:");
        const marchSamples = await db.collection('transactions').find({
            timestamp: { $gte: new Date(2025, 2, 1), $lt: new Date(2025, 3, 1) }
        }).limit(5).toArray();
        
        marchSamples.forEach((t, i) => {
            console.log(`   Transaction ${i+1} (ID: ${t.transactionId}):`);
            console.log(`      paymentMethod: "${t.paymentMethod}" (type: ${typeof t.paymentMethod})`);
            console.log(`      cashAmount: ${t.cashAmount} (type: ${typeof t.cashAmount})`);
            console.log(`      cardAmount: ${t.cardAmount} (type: ${typeof t.cardAmount})`);
            console.log(`      cashier: "${t.cashier}"`);
            console.log(`      store: "${t.store}"`);
            console.log(`      paymentBreakdown: ${JSON.stringify(t.paymentBreakdown)}`);
            console.log('');
        });
        
        // 2. Check category-based sales totals
        console.log("2️⃣ Category Sales Totals (March 2025):");
        const categoryTotals = await db.collection('transactions').aggregate([
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
                    transactionCount: { $sum: 1 },
                    avgTransaction: { $avg: "$total" }
                }
            }
        ]).toArray();
        
        categoryTotals.forEach(cat => {
            console.log(`   ${cat._id}:`);
            console.log(`      Total Sales: $${cat.totalSales} (type: ${typeof cat.totalSales})`);
            console.log(`      Transactions: ${cat.transactionCount}`);
            console.log(`      Avg Transaction: $${cat.avgTransaction.toFixed(2)}`);
        });
        
        // 3. Check for any transactions with invalid data
        console.log("\n3️⃣ Checking for Invalid Data:");
        const invalidTransactions = await db.collection('transactions').find({
            timestamp: { $gte: new Date(2025, 2, 1), $lt: new Date(2025, 3, 1) },
            $or: [
                { paymentMethod: { $exists: false } },
                { paymentMethod: null },
                { paymentMethod: "" },
                { total: { $exists: false } },
                { total: null },
                { total: NaN },
                { items: { $size: 0 } }
            ]
        }).toArray();
        
        console.log(`   Found ${invalidTransactions.length} invalid transactions`);
        if (invalidTransactions.length > 0) {
            invalidTransactions.slice(0, 3).forEach(t => {
                console.log(`      ID ${t.transactionId}: paymentMethod="${t.paymentMethod}", total=${t.total}, items=${t.items.length}`);
            });
        }
        
        // 4. Check tobacco and lottery specifically
        console.log("\n4️⃣ Tobacco & Lottery Specific Check:");
        const tobaccoLottery = await db.collection('transactions').find({
            timestamp: { $gte: new Date(2025, 2, 1), $lt: new Date(2025, 3, 1) },
            "items.category": { $in: ["Tobacco", "Lottery"] }
        }).limit(5).toArray();
        
        tobaccoLottery.forEach(t => {
            console.log(`   ID ${t.transactionId}:`);
            console.log(`      Category: ${t.items[0].category}`);
            console.log(`      Total: $${t.total} (type: ${typeof t.total})`);
            console.log(`      Payment: ${t.paymentMethod}`);
            console.log(`      Items: ${t.items.map(i => `${i.name} ($${i.price})`).join(', ')}`);
        });
        
        // 5. Compare with working July transactions
        console.log("\n5️⃣ Comparison with Working July Transactions:");
        const julySample = await db.collection('transactions').findOne({
            timestamp: { $gte: new Date(2025, 6, 1), $lt: new Date(2025, 7, 1) }
        });
        
        const marchSample = await db.collection('transactions').findOne({
            timestamp: { $gte: new Date(2025, 2, 1), $lt: new Date(2025, 3, 1) }
        });
        
        console.log("   July Transaction Structure:");
        if (julySample) {
            console.log(`      paymentMethod: "${julySample.paymentMethod}"`);
            console.log(`      cashAmount: ${julySample.cashAmount}`);
            console.log(`      cardAmount: ${julySample.cardAmount}`);
            console.log(`      paymentBreakdown: ${JSON.stringify(julySample.paymentBreakdown)}`);
        }
        
        console.log("   March Transaction Structure:");
        if (marchSample) {
            console.log(`      paymentMethod: "${marchSample.paymentMethod}"`);
            console.log(`      cashAmount: ${marchSample.cashAmount}`);
            console.log(`      cardAmount: ${marchSample.cardAmount}`);
            console.log(`      paymentBreakdown: ${JSON.stringify(marchSample.paymentBreakdown)}`);
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

debugMarch2025Issues();