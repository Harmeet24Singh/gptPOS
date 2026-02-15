const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkDatabaseDirectly() {
    const client = new MongoClient(process.env.MONGO_URI);
    
    try {
        await client.connect();
        const db = client.db(process.env.MONGO_DB);
        const collection = db.collection('transactions');
        
        console.log("🔍 Checking October Data Directly in Database\n");
        
        // Find all October transactions
        const octoberTransactions = await collection.find({
            $and: [
                { timestamp: { $gte: new Date('2025-10-01') } },
                { timestamp: { $lt: new Date('2025-11-01') } }
            ]
        }).toArray();
        
        console.log(`📊 Database Results:`);
        console.log(`   Total October transactions in DB: ${octoberTransactions.length}`);
        
        // Calculate total
        const totalSales = octoberTransactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
        console.log(`   Total sales from DB: $${totalSales.toFixed(2)}`);
        
        // Check for duplicates by transactionId
        const transactionIds = {};
        let duplicates = 0;
        
        octoberTransactions.forEach(transaction => {
            const transId = transaction.transactionId;
            if (!transId) return;
            
            if (transactionIds[transId]) {
                transactionIds[transId]++;
                duplicates++;
            } else {
                transactionIds[transId] = 1;
            }
        });
        
        console.log(`   Unique transaction IDs: ${Object.keys(transactionIds).length}`);
        console.log(`   Duplicate transactions: ${duplicates}`);
        
        if (duplicates > 0) {
            console.log(`\n❌ PROBLEM: Database still has ${duplicates} duplicates!`);
            console.log(`   This explains why you're still seeing $78,892`);
            
            // Show some examples
            const duplicateIds = Object.entries(transactionIds)
                .filter(([id, count]) => count > 1)
                .slice(0, 3);
            
            console.log(`\n📝 Example duplicates:`);
            duplicateIds.forEach(([id, count]) => {
                console.log(`   TransactionID ${id}: appears ${count} times`);
            });
            
            console.log(`\n🔧 Need to run more thorough cleanup...`);
        } else {
            console.log(`\n✅ Database looks clean! No duplicates found.`);
            console.log(`   If API still shows $78,892, it might be a cache issue.`);
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkDatabaseDirectly();