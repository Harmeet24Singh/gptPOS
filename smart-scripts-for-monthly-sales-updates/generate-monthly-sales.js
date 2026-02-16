const { MongoClient } = require('mongodb');
const readline = require('readline');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Categories with realistic items and payment preferences
const CATEGORY_CONFIG = {
    Alcohol: {
        items: [
            { name: "Budweiser 6-pack", basePrice: 12.99, variance: 0.8 },
            { name: "Corona 6-pack", basePrice: 14.99, variance: 0.7 },
            { name: "Heineken 6-pack", basePrice: 16.99, variance: 0.6 },
            { name: "Guinness 4-pack", basePrice: 18.99, variance: 0.9 },
            { name: "Red Wine Bottle", basePrice: 19.99, variance: 0.8 },
            { name: "White Wine Bottle", basePrice: 18.99, variance: 0.7 },
            { name: "Vodka 750ml", basePrice: 24.99, variance: 0.6 },
            { name: "Whiskey 750ml", basePrice: 29.99, variance: 0.8 },
            { name: "Tequila 750ml", basePrice: 22.99, variance: 0.7 },
            { name: "Rum 750ml", basePrice: 21.99, variance: 0.9 }
        ],
        cashPercent: 70,
        taxRate: 0.13,
        avgItemsPerTransaction: 1.8
    },
    Grocery: {
        items: [
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
        ],
        cashPercent: 70,
        taxRate: 0.13,
        avgItemsPerTransaction: 3.2
    },
    Tobacco: {
        items: [
            { name: "Marlboro Pack", basePrice: 14.99, variance: 0.3 },
            { name: "Camel Pack", basePrice: 13.99, variance: 0.4 },
            { name: "Newport Pack", basePrice: 15.99, variance: 0.2 },
            { name: "Parliament Pack", basePrice: 16.99, variance: 0.3 },
            { name: "Lucky Strike Pack", basePrice: 12.99, variance: 0.4 }
        ],
        cashPercent: 70,
        taxRate: 0.13,
        avgItemsPerTransaction: 1.2
    },
    Lottery: {
        items: [
            { name: "Scratch Ticket $1", basePrice: 1.00, variance: 0 },
            { name: "Scratch Ticket $2", basePrice: 2.00, variance: 0 },
            { name: "Scratch Ticket $5", basePrice: 5.00, variance: 0 },
            { name: "Scratch Ticket $10", basePrice: 10.00, variance: 0 },
            { name: "Powerball Ticket", basePrice: 3.00, variance: 0 },
            { name: "Mega Millions Ticket", basePrice: 2.00, variance: 0 }
        ],
        cashPercent: 70,
        taxRate: 0,
        avgItemsPerTransaction: 2.1
    }
};

function getRandomPrice(item) {
    const variance = item.basePrice * item.variance;
    return parseFloat((item.basePrice + (Math.random() - 0.5) * variance).toFixed(2));
}

function generateTransactionItems(category, targetAmount) {
    const config = CATEGORY_CONFIG[category];
    const items = [];
    let subtotal = 0;
    const numItems = Math.max(1, Math.round(config.avgItemsPerTransaction + (Math.random() - 0.5)));
    
    for (let i = 0; i < numItems && subtotal < targetAmount * 0.9; i++) {
        const item = config.items[Math.floor(Math.random() * config.items.length)];
        const price = getRandomPrice(item);
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity like July structure
        const itemTotal = price * quantity;
        
        items.push({
            barcode: `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`,
            name: item.name,
            price: price,
            quantity: quantity, // July structure
            total: itemTotal,   // July structure
            category: category
        });
        subtotal += itemTotal;
    }
    
    return items;
}

function generateTransaction(transactionId, month, year, category, targetAmount, forcePaymentMethod = null) {
    const items = generateTransactionItems(category, targetAmount);
    const subtotal = parseFloat(items.reduce((sum, item) => sum + item.total, 0).toFixed(2));
    const config = CATEGORY_CONFIG[category];
    const totalTax = parseFloat((subtotal * config.taxRate).toFixed(2));
    const total = parseFloat((subtotal + totalTax).toFixed(2));
    
    let paymentMethod;
    
    if (forcePaymentMethod) {
        paymentMethod = forcePaymentMethod;
    } else {
        const isCash = Math.random() < (config.cashPercent / 100);
        paymentMethod = isCash ? "cash" : "card";
    }
    
    // Generate random timestamp within the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
    
    // JULY STRUCTURE EXACTLY - no extra fields
    return {
        transactionId: transactionId,
        timestamp: new Date(randomTime),
        items: items,
        subtotal: subtotal,
        tax: totalTax,
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
}

async function getNextTransactionId(db) {
    const lastTransaction = await db.collection('transactions')
        .find({})
        .sort({ transactionId: -1 })
        .limit(1)
        .toArray();
    
    return lastTransaction.length > 0 ? lastTransaction[0].transactionId + 1 : 1;
}

async function generateMonthlySales() {
    console.log("🚀 SMART MONTHLY SALES GENERATOR");
    console.log("=".repeat(50));
    
    // Get individual category targets
    console.log("\n💰 Enter sales targets for each category:");
    
    // Get user input for targets
    const alcoholTarget = await new Promise((resolve) => {
        rl.question('🍺 Alcohol sales target: $', (answer) => {
            resolve(parseFloat(answer) || 0);
        });
    });
    
    const groceryTarget = await new Promise((resolve) => {
        rl.question('🛒 Grocery sales target: $', (answer) => {
            resolve(parseFloat(answer) || 0);
        });
    });
    
    const tobaccoTarget = await new Promise((resolve) => {
        rl.question('🚬 Tobacco sales target: $', (answer) => {
            resolve(parseFloat(answer) || 0);
        });
    });
    
    const lotteryTarget = await new Promise((resolve) => {
        rl.question('🎲 Lottery sales target: $', (answer) => {
            resolve(parseFloat(answer) || 0);
        });
    });
    
    const totalTarget = alcoholTarget + groceryTarget + tobaccoTarget + lotteryTarget;
    
    if (totalTarget <= 0) {
        console.log("❌ Invalid sales amounts. Exiting...");
        rl.close();
        return;
    }
    
    // Auto-detect current month/year
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();
    const monthName = now.toLocaleString('default', { month: 'long' });
    
    console.log(`\n📅 Generating sales for ${monthName} ${year}`);
    console.log(`🎯 Targets:`);
    console.log(`   🍺 Alcohol: $${alcoholTarget.toLocaleString()}`);
    console.log(`   🛒 Grocery: $${groceryTarget.toLocaleString()}`);
    console.log(`   🚬 Tobacco: $${tobaccoTarget.toLocaleString()}`);
    console.log(`   🎲 Lottery: $${lotteryTarget.toLocaleString()}`);
    console.log(`   📊 Total: $${totalTarget.toLocaleString()}`);
    
    const client = new MongoClient(process.env.MONGO_URI);
    
    try {
        await client.connect();
        const db = client.db(process.env.MONGO_DB);
        
        // Check existing sales by category (FIXED METHOD - properly detect categories)
        const existingSalesByCategory = await db.collection('transactions').aggregate([
            {
                $match: {
                    timestamp: { 
                        $gte: new Date(year, month - 1, 1),
                        $lt: new Date(year, month, 1)
                    }
                }
            },
            {
                $addFields: {
                    categoryType: {
                        $cond: {
                            if: { $gt: [{ $size: { $filter: { input: "$items", cond: { $eq: ["$$this.category", "Alcohol"] } } } }, 0] },
                            then: "Alcohol",
                            else: {
                                $cond: {
                                    if: { $gt: [{ $size: { $filter: { input: "$items", cond: { $eq: ["$$this.category", "Grocery"] } } } }, 0] },
                                    then: "Grocery",
                                    else: {
                                        $cond: {
                                            if: { $gt: [{ $size: { $filter: { input: "$items", cond: { $eq: ["$$this.category", "Tobacco"] } } } }, 0] },
                                            then: "Tobacco",
                                            else: {
                                                $cond: {
                                                    if: { $gt: [{ $size: { $filter: { input: "$items", cond: { $in: ["$$this.category", ["Lottery", "Lotto"]] } } } }, 0] },
                                                    then: "Lottery",
                                                    else: "Other"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                $match: {
                    categoryType: { $in: ["Alcohol", "Grocery", "Tobacco", "Lottery"] }
                }
            },
            {
                $group: {
                    _id: "$categoryType",
                    total: { $sum: "$total" },
                    count: { $sum: 1 }
                }
            }
        ]).toArray();
        
        console.log(`\n📊 Current ${monthName} sales by category:`);
        const categoryTargets = {
            Alcohol: alcoholTarget,
            Grocery: groceryTarget,
            Tobacco: tobaccoTarget,
            Lottery: lotteryTarget
        };
        
        let nextTransactionId = await getNextTransactionId(db);
        const transactions = [];
        const MAX_CARD_SALES = 15000;
        
        // Get existing card sales for the month to respect $15K limit
        const existingCardSales = await db.collection('transactions').aggregate([
            {
                $match: {
                    timestamp: { 
                        $gte: new Date(year, month - 1, 1),
                        $lt: new Date(year, month, 1)
                    },
                    transactionType: "card"
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$total" }
                }
            }
        ]).toArray();
        
        let totalCardAmount = existingCardSales[0]?.total || 0;
        console.log(`\n💳 Existing card sales: $${totalCardAmount.toFixed(2)} / $${MAX_CARD_SALES} limit`);
        
        if (totalCardAmount >= MAX_CARD_SALES) {
            console.log(`⚠️  Card limit already reached - all new transactions will be cash only`);
        }
        
        // Generate transactions for each category
        for (const [category, target] of Object.entries(categoryTargets)) {
            if (target <= 0) continue;
            
            const existing = existingSalesByCategory.find(s => s._id === category);
            const existingAmount = existing ? existing.total : 0;
            const existingCount = existing ? existing.count : 0;
            
            console.log(`   ${category}: $${existingAmount.toFixed(2)} (${existingCount} transactions)`);
            
            if (existingAmount >= target * 0.95) {
                console.log(`     ✅ Target already reached!`);
                continue;
            }
            
            const remainingTarget = target - existingAmount;
            console.log(`     🎯 Need: $${remainingTarget.toFixed(2)}`);
            
            let categoryGenerated = 0;
            let categoryCount = 0;
            let categoryCash = 0;
            let categoryCard = 0;
            
            // BETTER ALGORITHM - ensure we actually reach the target
            while (categoryGenerated < remainingTarget * 0.98 && categoryCount < 2000) {
                const avgTransactionAmount = Math.max(5, remainingTarget / Math.max(50, Math.floor(remainingTarget / 15)));
                const transactionAmount = avgTransactionAmount * (0.7 + Math.random() * 0.6);
                
                // Determine payment method with card limit constraint
                let forcePaymentMethod = null;
                const wouldBeCardAmount = transactionAmount * 0.3; // 30% card target
                
                if (totalCardAmount + wouldBeCardAmount > MAX_CARD_SALES) {
                    forcePaymentMethod = "cash"; // Force cash if card limit would be exceeded
                }
                
                const transaction = generateTransaction(
                    nextTransactionId++,
                    month,
                    year,
                    category,
                    transactionAmount,
                    forcePaymentMethod
                );
                
                transactions.push(transaction);
                categoryGenerated += transaction.total;
                categoryCount++;
                
                if (transaction.paymentMethod === "cash") {
                    categoryCash += transaction.total;
                } else {
                    categoryCard += transaction.total;
                    totalCardAmount += transaction.total;
                }
                
                // Stop if we hit card limit
                if (totalCardAmount >= MAX_CARD_SALES) {
                    console.log(`     💳 Card limit of $${MAX_CARD_SALES} reached - remaining transactions will be cash only`);
                }
            }
            
            const cashPercent = categoryCash / (categoryCash + categoryCard) * 100;
            console.log(`     ✅ Generated: ${categoryCount} transactions, $${categoryGenerated.toFixed(2)}`);
            console.log(`     💰 Cash: $${categoryCash.toFixed(2)} (${cashPercent.toFixed(1)}%) | Card: $${categoryCard.toFixed(2)} (${(100-cashPercent).toFixed(1)}%)`);
        }
        
        if (transactions.length === 0) {
            console.log("\n✅ All targets already reached! No new transactions needed.");
            rl.close();
            return;
        }
        
        console.log(`\n💾 Inserting ${transactions.length} transactions...`);
        await db.collection('transactions').insertMany(transactions);
        
        const finalTotalCard = transactions.reduce((sum, t) => sum + t.cardAmount, 0);
        const finalTotalCash = transactions.reduce((sum, t) => sum + t.cashAmount, 0);
        const finalTotal = finalTotalCard + finalTotalCash;
        
        console.log(`\n🎉 SUCCESS!`);
        console.log(`📊 Generated Sales Summary:`);
        console.log(`   💰 Total Cash: $${finalTotalCash.toFixed(2)} (${(finalTotalCash/finalTotal*100).toFixed(1)}%)`);
        console.log(`   💳 Total Card: $${finalTotalCard.toFixed(2)} (${(finalTotalCard/finalTotal*100).toFixed(1)}%)`);
        console.log(`   📝 Total Transactions: ${transactions.length}`);
        console.log(`   🎯 Final Card Total: $${totalCardAmount.toFixed(2)} (${totalCardAmount <= MAX_CARD_SALES ? '✅ Within' : '❌ Exceeds'} $${MAX_CARD_SALES} limit)`);
        console.log(`   💳 Card Generated: $${finalTotalCard.toFixed(2)}`);
        console.log(`   📊 Month Status: ${totalCardAmount <= MAX_CARD_SALES ? 'Compliant' : 'Over Limit'}`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        rl.close();
    }
}

// Run the generator
generateMonthlySales();