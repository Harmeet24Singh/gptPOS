const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixAllPaymentInconsistencies() {
    const client = new MongoClient(process.env.MONGO_URI);
    
    try {
        await client.connect();
        const db = client.db(process.env.MONGO_DB);
        
        console.log("🔧 FIXING ALL PAYMENT METHOD INCONSISTENCIES\n");
        
        // Fix card transactions with wrong amounts
        console.log("1️⃣ Fixing card transactions...");
        const cardResult = await db.collection('transactions').updateMany(
            { paymentMethod: "card" },
            [
                {
                    $set: {
                        cardAmount: "$total",
                        cashAmount: 0,
                        creditAmount: 0
                    }
                }
            ]
        );
        console.log(`   ✅ Updated ${cardResult.modifiedCount} card transactions\n`);
        
        // Fix cash transactions with wrong amounts
        console.log("2️⃣ Fixing cash transactions...");
        const cashResult = await db.collection('transactions').updateMany(
            { paymentMethod: "cash" },
            [
                {
                    $set: {
                        cashAmount: "$total",
                        cardAmount: 0,
                        creditAmount: 0
                    }
                }
            ]
        );
        console.log(`   ✅ Updated ${cashResult.modifiedCount} cash transactions\n`);
        
        // Fix credit transactions (if any)
        console.log("3️⃣ Fixing credit transactions...");
        const creditResult = await db.collection('transactions').updateMany(
            { paymentMethod: "credit" },
            [
                {
                    $set: {
                        creditAmount: "$total",
                        cashAmount: 0,
                        cardAmount: 0
                    }
                }
            ]
        );
        console.log(`   ✅ Updated ${creditResult.modifiedCount} credit transactions\n`);
        
        // Verify the fix
        console.log("🔍 Verifying fix...");
        const stillInconsistent = await db.collection('transactions').find({
            $or: [
                { paymentMethod: "card", $expr: { $ne: ["$cardAmount", "$total"] } },
                { paymentMethod: "card", cashAmount: { $ne: 0 } },
                { paymentMethod: "cash", $expr: { $ne: ["$cashAmount", "$total"] } },
                { paymentMethod: "cash", cardAmount: { $ne: 0 } },
                { paymentMethod: "credit", $expr: { $ne: ["$creditAmount", "$total"] } },
                { paymentMethod: "credit", cashAmount: { $ne: 0 } },
                { paymentMethod: "credit", cardAmount: { $ne: 0 } }
            ]
        }).count();
        
        console.log(`   Remaining inconsistent transactions: ${stillInconsistent}`);
        
        if (stillInconsistent === 0) {
            console.log("   🎉 ALL PAYMENT INCONSISTENCIES FIXED!\n");
        }
        
        // Sample check
        console.log("📋 Sample verification:");
        const samples = await db.collection('transactions').find({}).limit(5).toArray();
        samples.forEach(t => {
            console.log(`   ID ${t.transactionId}: ${t.paymentMethod} - cash:$${t.cashAmount}, card:$${t.cardAmount}, total:$${t.total}`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

fixAllPaymentInconsistencies();