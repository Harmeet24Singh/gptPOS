const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixJanuaryPaymentFields() {
    const client = new MongoClient(process.env.MONGO_URI);
    
    try {
        await client.connect();
        const db = client.db(process.env.MONGO_DB);
        const collection = db.collection('transactions');
        
        console.log("🔧 Fixing January Alcohol Payment Fields\n");
        
        // Get all January alcohol transactions
        const januaryAlcohol = await collection.find({
            timestamp: {
                $gte: new Date('2026-01-01'),
                $lt: new Date('2026-02-01')
            },
            "items.category": "Alcohol"
        }).toArray();
        
        console.log(`Found ${januaryAlcohol.length} January alcohol transactions to fix`);
        
        let updated = 0;
        
        for (const transaction of januaryAlcohol) {
            const updateDoc = {};
            let needsUpdate = false;
            
            // Ensure both cashAmount and cardAmount are always present
            if (transaction.paymentMethod === 'cash') {
                if (transaction.cashAmount === undefined || transaction.cashAmount === null) {
                    updateDoc.cashAmount = transaction.total;
                    needsUpdate = true;
                }
                if (transaction.cardAmount === undefined || transaction.cardAmount === null) {
                    updateDoc.cardAmount = 0;
                    needsUpdate = true;
                }
            } else if (transaction.paymentMethod === 'card') {
                if (transaction.cardAmount === undefined || transaction.cardAmount === null) {
                    updateDoc.cardAmount = transaction.total;
                    needsUpdate = true;
                }
                if (transaction.cashAmount === undefined || transaction.cashAmount === null) {
                    updateDoc.cashAmount = 0;
                    needsUpdate = true;
                }
            } else if (!transaction.paymentMethod) {
                // If no payment method, assign one randomly and set amounts
                const randomPayment = Math.random() < 0.6 ? 'card' : 'cash';
                updateDoc.paymentMethod = randomPayment;
                
                if (randomPayment === 'cash') {
                    updateDoc.cashAmount = transaction.total;
                    updateDoc.cardAmount = 0;
                } else {
                    updateDoc.cardAmount = transaction.total;
                    updateDoc.cashAmount = 0;
                }
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                await collection.updateOne(
                    { _id: transaction._id },
                    { $set: updateDoc }
                );
                updated++;
                
                if (updated % 20 === 0) {
                    console.log(`Updated ${updated} transactions...`);
                }
            }
        }
        
        console.log(`✅ Updated ${updated} transactions with proper payment fields`);
        
        // Verification
        const verification = await collection.find({
            timestamp: {
                $gte: new Date('2026-01-01'),
                $lt: new Date('2026-02-01')
            },
            "items.category": "Alcohol"
        }).toArray();
        
        let cashCount = 0, cardCount = 0;
        let totalCashAmount = 0, totalCardAmount = 0;
        
        verification.forEach(t => {
            if (t.paymentMethod === 'cash') {
                cashCount++;
                totalCashAmount += t.cashAmount || 0;
            } else if (t.paymentMethod === 'card') {
                cardCount++;
                totalCardAmount += t.cardAmount || 0;
            }
        });
        
        console.log(`\n📊 Final Payment Verification:`);
        console.log(`   Cash transactions: ${cashCount} ($${totalCashAmount.toFixed(2)})`);
        console.log(`   Card transactions: ${cardCount} ($${totalCardAmount.toFixed(2)})`);
        console.log(`   Total alcohol sales: $${(totalCashAmount + totalCardAmount).toFixed(2)}`);
        
        // Show sample of fixed transactions
        const samples = verification.slice(0, 5);
        console.log(`\n📝 Sample transactions after fix:`);
        samples.forEach((t, i) => {
            console.log(`   ${i+1}. ID ${t.transactionId}: ${t.paymentMethod} - Cash: $${t.cashAmount}, Card: $${t.cardAmount}, Total: $${t.total}`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

fixJanuaryPaymentFields();