const { MongoClient } = require("mongodb");

async function debugTimestamps() {
    const client = new MongoClient("mongodb://localhost:27017");
    await client.connect();
    
    const db = client.db("convenience_store");
    const transactions = db.collection("transactions");
    
    // Get some samples of alcohol transactions to see their timestamps
    const alcoholSamples = await transactions.find({
        "items.category": "Alcohol",
        "cashier": "December-Sales"
    }).limit(5).toArray();
    
    console.log("Generated alcohol transaction timestamps:");
    alcoholSamples.forEach((t, i) => {
        console.log(`${i+1}. ${t.timestamp} (${typeof t.timestamp})`);
    });
    
    // Check for 2024 December instead
    const december2024 = await transactions.countDocuments({
        timestamp: { 
            $gte: new Date("2024-12-01T00:00:00.000Z"), 
            $lt: new Date("2025-01-01T00:00:00.000Z") 
        }
    });
    
    console.log(`\nDecember 2024 transactions: ${december2024}`);
    
    // Check what years we have
    const pipeline = [
        { $project: { year: { $year: "$timestamp" } } },
        { $group: { _id: "$year", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ];
    
    const yearCounts = await transactions.aggregate(pipeline).toArray();
    console.log("\nTransactions by year:");
    yearCounts.forEach(y => console.log(`${y._id}: ${y.count}`));
    
    await client.close();
}

debugTimestamps().catch(console.error);