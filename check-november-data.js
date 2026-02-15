const { MongoClient } = require("mongodb");
require("dotenv").config();

async function checkNovemberData() {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
    const dbName = process.env.MONGO_DB || "convenience_store";
    
    console.log("Connecting to:", uri);
    
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    
    // Check November 2025 data
    const novemberStart = "2025-11-01T00:00:00.000Z";
    const novemberEnd = "2025-12-01T00:00:00.000Z";
    
    console.log("🗓️  Searching for November 2025 data...\n");
    
    // All November transactions
    const allNovember = await db.collection("transactions").countDocuments({
        timestamp: { $gte: novemberStart, $lt: novemberEnd }
    });
    
    console.log(`📊 Total November transactions: ${allNovember}`);
    
    if (allNovember > 0) {
        // November grocery transactions
        const novemberGrocery = await db.collection("transactions").countDocuments({
            timestamp: { $gte: novemberStart, $lt: novemberEnd },
            "items.category": "Grocery"
        });
        
        // November alcohol transactions  
        const novemberAlcohol = await db.collection("transactions").countDocuments({
            timestamp: { $gte: novemberStart, $lt: novemberEnd },
            "items.category": "Alcohol"
        });
        
        // November lottery transactions
        const novemberLottery = await db.collection("transactions").countDocuments({
            timestamp: { $gte: novemberStart, $lt: novemberEnd },
            "items.category": { $in: ["Lotto", "lotto"] }
        });
        
        console.log(`🛒 November grocery transactions: ${novemberGrocery}`);
        console.log(`🍺 November alcohol transactions: ${novemberAlcohol}`);
        console.log(`🎰 November lottery transactions: ${novemberLottery}`);
        
        // Get sample transactions to see structure
        const samples = await db.collection("transactions").find({
            timestamp: { $gte: novemberStart, $lt: novemberEnd }
        }).limit(3).toArray();
        
        console.log("\n📄 Sample November transactions:");
        samples.forEach((t, i) => {
            console.log(`${i+1}. ${t.timestamp} - ${t.items?.map(item => item.name).join(', ')}`);
            console.log(`   Categories: ${t.items?.map(item => item.category).join(', ')}`);
            console.log(`   Total: $${t.total}`);
            console.log(`   Cashier: ${t.cashier || 'N/A'}`);
        });
        
        // Calculate totals by category
        const pipeline = [
            {
                $match: {
                    timestamp: { $gte: novemberStart, $lt: novemberEnd }
                }
            },
            {
                $unwind: "$items"
            },
            {
                $group: {
                    _id: "$items.category",
                    totalSales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                    transactionCount: { $sum: 1 }
                }
            },
            {
                $sort: { totalSales: -1 }
            }
        ];
        
        const categoryTotals = await db.collection("transactions").aggregate(pipeline).toArray();
        
        console.log("\n💰 November sales by category:");
        categoryTotals.forEach(cat => {
            console.log(`   ${cat._id}: $${cat.totalSales.toFixed(2)} (${cat.transactionCount} items)`);
        });
    }
    
    await client.close();
}

checkNovemberData().catch(console.error);