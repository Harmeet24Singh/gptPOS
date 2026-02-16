const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkAllJanuaryPayments() {
    const client = new MongoClient(process.env.MONGO_URI);
    
    try {
        await client.connect();
        const db = client.db(process.env.MONGO_DB);
        
        // Get ALL January transactions
        const allJanuary = await db.collection('transactions').find({
            timestamp: {
                $gte: new Date('2026-01-01'),
                $lt: new Date('2026-02-01')
            }
        }).toArray();
        
        console.log("🔍 Checking ALL January Transactions Payment Methods\n");
        console.log(`Total January transactions: ${allJanuary.length}\n`);
        
        const paymentBreakdown = {
            cash: 0,
            card: 0,
            missing: 0,
            undefined: 0,
            null: 0,
            unknown: 0,
            other: []
        };
        
        const categoriesWithIssues = {};
        
        allJanuary.forEach(transaction => {
            const pm = transaction.paymentMethod;
            
            if (pm === undefined) {
                paymentBreakdown.undefined++;
                const category = transaction.items?.[0]?.category || 'Unknown Category';
                categoriesWithIssues[category] = (categoriesWithIssues[category] || 0) + 1;
            } else if (pm === null) {
                paymentBreakdown.null++;
            } else if (pm === 'cash') {
                paymentBreakdown.cash++;
            } else if (pm === 'card') {
                paymentBreakdown.card++;
            } else if (pm === 'unknown') {
                paymentBreakdown.unknown++;
            } else if (!pm) {
                paymentBreakdown.missing++;
            } else {
                if (!paymentBreakdown.other.includes(pm)) {
                    paymentBreakdown.other.push(pm);
                }
            }
        });
        
        console.log(`📊 ALL January Payment Methods:`);
        console.log(`   Cash: ${paymentBreakdown.cash}`);
        console.log(`   Card: ${paymentBreakdown.card}`);
        console.log(`   Undefined: ${paymentBreakdown.undefined}`);
        console.log(`   Null: ${paymentBreakdown.null}`);
        console.log(`   Missing: ${paymentBreakdown.missing}`);
        console.log(`   Unknown: ${paymentBreakdown.unknown}`);
        console.log(`   Other: ${paymentBreakdown.other.join(', ') || 'None'}`);
        
        if (Object.keys(categoriesWithIssues).length > 0) {
            console.log(`\n⚠️  Categories with missing payment methods:`);
            Object.entries(categoriesWithIssues).forEach(([category, count]) => {
                console.log(`   ${category}: ${count} transactions`);
            });
        }
        
        // Show samples of problematic transactions
        const problemTransactions = allJanuary.filter(t => 
            !t.paymentMethod || t.paymentMethod === 'unknown'
        ).slice(0, 5);
        
        if (problemTransactions.length > 0) {
            console.log(`\n🔴 Sample transactions with payment issues:`);
            problemTransactions.forEach((t, i) => {
                console.log(`   ${i+1}. ID ${t.transactionId}: ${t.paymentMethod || 'UNDEFINED'} - Category: ${t.items?.[0]?.category || 'None'} - Total: $${t.total}`);
            });
        } else {
            console.log(`\n✅ All transactions have proper payment methods!`);
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkAllJanuaryPayments();