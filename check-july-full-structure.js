const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkJulyAdditionalFields() {
    const client = new MongoClient(process.env.MONGO_URI);
    
    try {
        await client.connect();
        const db = client.db(process.env.MONGO_DB);
        
        console.log("🔍 CHECKING JULY ADDITIONAL FIELDS\n");
        
        // Get a sample July transaction to see full structure
        const julyTransaction = await db.collection('transactions').findOne({
            timestamp: { $gte: new Date("2025-07-01"), $lt: new Date("2025-08-01") }
        });
        
        console.log("📋 Complete July Transaction Structure:");
        console.log(JSON.stringify(julyTransaction, null, 2));
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkJulyAdditionalFields();