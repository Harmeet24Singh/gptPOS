const { MongoClient } = require("mongodb");
require("dotenv").config();

async function checkAllMonthsData() {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
    const dbName = process.env.MONGO_DB || "convenience_store";
    
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    
    console.log("📊 Checking all months in 2025...\n");
    
    const months = [
        { name: "January", start: "2025-01-01T00:00:00.000Z", end: "2025-02-01T00:00:00.000Z" },
        { name: "February", start: "2025-02-01T00:00:00.000Z", end: "2025-03-01T00:00:00.000Z" },
        { name: "March", start: "2025-03-01T00:00:00.000Z", end: "2025-04-01T00:00:00.000Z" },
        { name: "April", start: "2025-04-01T00:00:00.000Z", end: "2025-05-01T00:00:00.000Z" },
        { name: "May", start: "2025-05-01T00:00:00.000Z", end: "2025-06-01T00:00:00.000Z" },
        { name: "June", start: "2025-06-01T00:00:00.000Z", end: "2025-07-01T00:00:00.000Z" },
        { name: "July", start: "2025-07-01T00:00:00.000Z", end: "2025-08-01T00:00:00.000Z" },
        { name: "August", start: "2025-08-01T00:00:00.000Z", end: "2025-09-01T00:00:00.000Z" },
        { name: "September", start: "2025-09-01T00:00:00.000Z", end: "2025-10-01T00:00:00.000Z" },
        { name: "October", start: "2025-10-01T00:00:00.000Z", end: "2025-11-01T00:00:00.000Z" },
        { name: "November", start: "2025-11-01T00:00:00.000Z", end: "2025-12-01T00:00:00.000Z" },
        { name: "December", start: "2025-12-01T00:00:00.000Z", end: "2026-01-01T00:00:00.000Z" }
    ];
    
    for (const month of months) {
        const count = await db.collection("transactions").countDocuments({
            timestamp: { $gte: month.start, $lt: month.end }
        });
        
        if (count > 0) {
            console.log(`📅 ${month.name} 2025: ${count} transactions`);
        }
    }
    
    // Also check for any transactions with different timestamp formats
    console.log("\n🔍 Checking all transactions...");
    const totalTransactions = await db.collection("transactions").countDocuments();
    console.log(`Total transactions in database: ${totalTransactions}`);
    
    if (totalTransactions > 0) {
        // Get some samples to see timestamp formats
        const samples = await db.collection("transactions").find({}).limit(5).toArray();
        console.log("\n📄 Sample timestamps:");
        samples.forEach((t, i) => {
            console.log(`${i+1}. ${t.timestamp} (${typeof t.timestamp})`);
        });
    }
    
    await client.close();
}

checkAllMonthsData().catch(console.error);