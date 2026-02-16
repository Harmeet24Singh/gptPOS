const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Grocery items with realistic prices
const GROCERY_ITEMS = [
    { name: "Milk 1L", basePrice: 3.99, variance: 0.2 },
    { name: "Bread Loaf", basePrice: 2.99, variance: 0.3 },
    { name: "Eggs Dozen", basePrice: 4.99, variance: 0.4 },
    { name: "Bananas 1lb", basePrice: 1.99, variance: 0.3 },
    { name: "Apples 1lb", basePrice: 2.99, variance: 0.2 },
    { name: "Orange Juice 1L", basePrice: 4.99, variance: 0.3 },
    { name: "Chips Bag", basePrice: 3.99, variance: 0.5 },
    { name: "Soda 2L", basePrice: 2.99, variance: 0.4 },
    { name: "Frozen Pizza", basePrice: 6.99, variance: 0.6 },
    { name: "Ice Cream 1L", basePrice: 5.99, variance: 0.5 }
];

function getRandomPrice(item) {
    const variance = item.basePrice * item.variance;
    return parseFloat((item.basePrice + (Math.random() - 0.5) * variance).toFixed(2));
}

function generateGroceryTransaction(transactionId, targetAmount) {
    const numItems = Math.floor(Math.random() * 4) + 1; // 1-4 items per transaction
    const items = [];
    let subtotal = 0;
    
    for (let i = 0; i < numItems; i++) {
        const item = GROCERY_ITEMS[Math.floor(Math.random() * GROCERY_ITEMS.length)];
        const price = getRandomPrice(item);
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
        const itemTotal = price * quantity;
        
        items.push({
            barcode: `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`,
            name: item.name,
            price: price,
            quantity: quantity,
            total: itemTotal,
            category: "Grocery"
        });
        subtotal += itemTotal;
    }
    
    const tax = subtotal * 0.13; // 13% tax
    const total = subtotal + tax;
    
    // 70% cash, 30% card
    const paymentMethod = Math.random() < 0.7 ? "cash" : "card";
    
    // Random timestamp in January 2026
    const startOfJan = new Date(2026, 0, 1).getTime();
    const endOfJan = new Date(2026, 0, 31, 23, 59, 59).getTime();
    const randomTime = startOfJan + Math.random() * (endOfJan - startOfJan);
    
    return {
        _id: new ObjectId(),
        items: items,
        subtotal: subtotal,
        tax: tax,
        total: total,
        paymentMethod: paymentMethod,
        transactionType: paymentMethod,
        timestamp: new Date(randomTime),
        cashier: "system",
        store: "Main Store",
        paymentBreakdown: [
            {
                method: paymentMethod,
                amount: total
            }
        ]
    };
}

async function addGroceryTransactions() {
    const client = new MongoClient(process.env.MONGO_URI);
    
    try {
        await client.connect();
        const db = client.db(process.env.MONGO_DB);
        
        console.log('🛒 ADDING GROCERY TRANSACTIONS FOR JANUARY 2026');
        console.log('================================================');
        
        // Get current grocery total
        const currentGrocery = await db.collection('transactions').aggregate([
            {
                $match: {
                    timestamp: { 
                        $gte: new Date(2026, 0, 1),
                        $lt: new Date(2026, 1, 1)
                    },
                    "items.category": "Grocery"
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
        
        const currentTotal = currentGrocery[0]?.totalAmount || 0;
        const target = 6000;
        const needed = target - currentTotal;
        
        console.log(`💰 Current grocery total: $${currentTotal.toFixed(2)}`);
        console.log(`🎯 Target grocery total: $${target.toFixed(2)}`);
        console.log(`📈 Need to add: $${needed.toFixed(2)}`);
        
        if (needed <= 0) {
            console.log('✅ Target already reached or exceeded!');
            return;
        }
        
        // Get next transaction ID
        const lastTransaction = await db.collection('transactions').findOne({}, { sort: { _id: -1 } });
        let nextId = (lastTransaction?._id || 0) + 1;
        
        const transactions = [];
        let generatedAmount = 0;
        let transactionCount = 0;
        
        // Generate transactions until we reach the target
        while (generatedAmount < needed * 0.98 && transactionCount < 500) { // 98% of target, max 500 transactions
            const avgAmount = Math.max(10, needed / 50); // Average $40-50 per transaction
            const targetAmount = avgAmount * (0.7 + Math.random() * 0.6);
            
            const transaction = generateGroceryTransaction(nextId++, targetAmount);
            transactions.push(transaction);
            generatedAmount += transaction.total;
            transactionCount++;
        }
        
        console.log(`\\n📝 Generated ${transactions.length} grocery transactions`);
        console.log(`💰 Total amount: $${generatedAmount.toFixed(2)}`);
        console.log(`🎯 Will achieve: $${(currentTotal + generatedAmount).toFixed(2)}`);
        
        // Insert transactions
        if (transactions.length > 0) {
            const result = await db.collection('transactions').insertMany(transactions);
            console.log(`✅ Inserted ${result.insertedCount} transactions`);
            
            // Verify final amount
            const finalGrocery = await db.collection('transactions').aggregate([
                {
                    $match: {
                        timestamp: { 
                            $gte: new Date(2026, 0, 1),
                            $lt: new Date(2026, 1, 1)
                        },
                        "items.category": "Grocery"
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
            
            const finalTotal = finalGrocery[0]?.totalAmount || 0;
            const finalCount = finalGrocery[0]?.transactionCount || 0;
            
            console.log(`\\n🎉 GROCERY ADDITION COMPLETED!`);
            console.log(`💰 Final grocery total: $${finalTotal.toFixed(2)}`);
            console.log(`📝 Final transactions: ${finalCount}`);
            console.log(`🎯 Target achievement: ${(finalTotal/target*100).toFixed(1)}%`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

addGroceryTransactions();