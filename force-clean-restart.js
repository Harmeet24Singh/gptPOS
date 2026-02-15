const { MongoClient } = require('mongodb');
require('dotenv').config();

async function forceCleanRestart() {
    console.log("🔄 Force Clean Database Connection and Test\n");
    
    // Create fresh connection
    const client = new MongoClient(process.env.MONGO_URI, {
        maxPoolSize: 1,  // Force single connection
        serverSelectionTimeoutMS: 5000,
    });
    
    try {
        await client.connect();
        const db = client.db(process.env.MONGO_DB);
        
        // Get fresh October data directly
        const octoberData = await db.collection('transactions').find({
            $and: [
                { timestamp: { $gte: new Date('2025-10-01') } },
                { timestamp: { $lt: new Date('2025-11-01') } }
            ]
        }).toArray();
        
        const total = octoberData.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
        
        console.log("🔍 Fresh Database Query Results:");
        console.log(`   October transactions: ${octoberData.length}`);
        console.log(`   October total: $${total.toFixed(2)}`);
        console.log(`   Target: $51,330.76`);
        console.log(`   Difference: $${(total - 51330.76).toFixed(2)}`);
        
        if (total > 70000) {
            console.log(`\n❌ CRITICAL: Database still has duplicates!`);
            console.log(`   The previous cleanup script may have failed.`);
            
            // Check for duplicates
            const transactionIds = {};
            let duplicateCount = 0;
            
            octoberData.forEach(t => {
                if (transactionIds[t.transactionId]) {
                    duplicateCount++;
                } else {
                    transactionIds[t.transactionId] = true;
                }
            });
            
            console.log(`   Duplicate transactions found: ${duplicateCount}`);
            console.log(`   Unique IDs: ${Object.keys(transactionIds).length}`);
            
            if (duplicateCount > 0) {
                console.log(`\n🔧 RUNNING IMMEDIATE CLEANUP:`);
                
                // Group and remove duplicates immediately
                const groups = {};
                octoberData.forEach(t => {
                    if (!groups[t.transactionId]) groups[t.transactionId] = [];
                    groups[t.transactionId].push(t);
                });
                
                let removed = 0;
                for (const [transId, transactions] of Object.entries(groups)) {
                    if (transactions.length > 1) {
                        // Keep most recent, remove others
                        transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                        const toRemove = transactions.slice(1);
                        
                        for (const duplicate of toRemove) {
                            await db.collection('transactions').deleteOne({ _id: duplicate._id });
                            removed++;
                        }
                    }
                }
                
                console.log(`   ✅ Removed ${removed} duplicates immediately`);
                
                // Recheck
                const cleanData = await db.collection('transactions').find({
                    $and: [
                        { timestamp: { $gte: new Date('2025-10-01') } },
                        { timestamp: { $lt: new Date('2025-11-01') } }
                    ]
                }).toArray();
                
                const newTotal = cleanData.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
                console.log(`   📊 After cleanup: ${cleanData.length} transactions, $${newTotal.toFixed(2)}`);
            }
            
        } else {
            console.log(`\n✅ Database is clean! October shows $${total.toFixed(2)}`);
            console.log(`   The issue must be API caching or browser cache.`);
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

forceCleanRestart();