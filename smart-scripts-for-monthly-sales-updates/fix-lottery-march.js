const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function generateMissingLotteryMarch() {
    const client = new MongoClient(process.env.MONGO_URI);
    
    try {
        await client.connect();
        const db = client.db(process.env.MONGO_DB);
        
        console.log("🎲 FIXING MARCH 2025 LOTTERY SALES TO REACH $24,000 TARGET\n");
        
        // Check current lottery sales
        const currentLottery = await db.collection('transactions').aggregate([
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
        
        const currentAmount = currentLottery.length > 0 ? currentLottery[0].totalSales : 0;
        const currentCount = currentLottery.length > 0 ? currentLottery[0].transactionCount : 0;
        const target = 24000;
        const needed = target - currentAmount;
        
        console.log(`Current Lottery Sales: $${currentAmount.toFixed(2)} (${currentCount} transactions)`);
        console.log(`Target: $${target.toFixed(2)}`);
        console.log(`Still needed: $${needed.toFixed(2)}`);
        
        if (needed <= 0) {
            console.log("✅ Target already reached!");
            return;
        }
        
        // Get next transaction ID
        const lastTransaction = await db.collection('transactions')
            .find({})
            .sort({ transactionId: -1 })
            .limit(1)
            .toArray();
        
        let nextTransactionId = lastTransaction.length > 0 ? lastTransaction[0].transactionId + 1 : 1;
        
        // Lottery items matching July structure
        const lotteryItems = [
            { name: "Scratch Ticket $1", price: 1.00 },
            { name: "Scratch Ticket $2", price: 2.00 },
            { name: "Scratch Ticket $5", price: 5.00 },
            { name: "Scratch Ticket $10", price: 10.00 },
            { name: "Powerball Ticket", price: 3.00 },
            { name: "Mega Millions Ticket", price: 2.00 }
        ];
        
        const transactions = [];
        let totalGenerated = 0;
        let count = 0;
        let totalCardAmount = 0;
        
        console.log("\n🏗️  Generating additional lottery transactions...");
        
        while (totalGenerated < needed && count < 5000) {
            // Generate transaction with 2-3 lottery items
            const numItems = Math.floor(Math.random() * 2) + 2; // 2-3 items
            const items = [];
            let subtotal = 0;
            
            for (let i = 0; i < numItems; i++) {
                const item = lotteryItems[Math.floor(Math.random() * lotteryItems.length)];
                const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
                const itemTotal = item.price * quantity;
                
                items.push({
                    barcode: `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`,
                    name: item.name,
                    price: item.price,
                    quantity: quantity,
                    total: itemTotal,
                    category: "Lottery"
                });
                subtotal += itemTotal;
            }
            
            const tax = 0; // No tax on lottery
            const total = subtotal;
            
            // 70% cash, 30% card
            const isCash = Math.random() < 0.7;
            const paymentMethod = isCash ? "cash" : "card";
            
            // Generate random timestamp in March 2025
            const startDate = new Date(2025, 2, 1);
            const endDate = new Date(2025, 3, 1);
            const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
            
            const transaction = {
                transactionId: nextTransactionId++,
                timestamp: new Date(randomTime),
                items: items,
                subtotal: subtotal,
                tax: tax,
                total: total,
                paymentMethod: paymentMethod,
                cashier: "system",
                store: "Main Store",
                cardAmount: paymentMethod === "card" ? total : 0,
                cashAmount: paymentMethod === "cash" ? total : 0,
                cashback: 0,
                paymentBreakdown: [
                    {
                        method: paymentMethod,
                        amount: total
                    }
                ],
                creditAmount: 0
            };
            
            transactions.push(transaction);
            totalGenerated += total;
            count++;
            
            if (paymentMethod === "card") {
                totalCardAmount += total;
            }
        }
        
        console.log(`Generated ${transactions.length} additional lottery transactions totaling $${totalGenerated.toFixed(2)}`);
        console.log(`Card amount: $${totalCardAmount.toFixed(2)}`);
        
        // Insert transactions
        await db.collection('transactions').insertMany(transactions);
        
        // Verify final totals
        const finalLottery = await db.collection('transactions').aggregate([
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
        
        const finalAmount = finalLottery.length > 0 ? finalLottery[0].totalSales : 0;
        const finalCount = finalLottery.length > 0 ? finalLottery[0].transactionCount : 0;
        const achievement = (finalAmount / target * 100).toFixed(1);
        
        console.log(`\n🎉 FINAL LOTTERY RESULTS:`);
        console.log(`   Total Lottery Sales: $${finalAmount.toFixed(2)} (${finalCount} transactions)`);
        console.log(`   Target Achievement: ${achievement}% of $${target}`);
        console.log(`   Added: ${transactions.length} new transactions`);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

generateMissingLotteryMarch();