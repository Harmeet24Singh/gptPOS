const { MongoClient } = require("mongodb");

async function testMongoQueries() {
    const client = new MongoClient("mongodb://localhost:27017");
    await client.connect();
    
    const db = client.db("convenience_store");
    const transactions = db.collection("transactions");
    
    console.log("=== Testing MongoDB Queries ===\n");
    
    // Test 1: All December transactions
    const decemberStart = new Date("2025-12-01T00:00:00.000Z");
    const decemberEnd = new Date("2026-01-01T00:00:00.000Z");
    
    // Check for both Date objects and string timestamps
    const allDecember = await transactions.countDocuments({
        timestamp: { $gte: decemberStart, $lt: decemberEnd }
    });
    
    const allDecemberStrings = await transactions.countDocuments({
        timestamp: { $gte: "2025-12-01T00:00:00.000Z", $lt: "2026-01-01T00:00:00.000Z" }
    });
    
    console.log(`1. All December transactions (Date objects): ${allDecember}`);
    console.log(`1. All December transactions (strings): ${allDecemberStrings}`);
    
    // Check a sample transaction to see timestamp type
    const sample = await transactions.findOne({});
    console.log(`Sample transaction timestamp type: ${typeof sample?.timestamp}`);
    
    // Test 2: December transactions with alcohol items
    const decemberWithAlcohol = await transactions.find({
        timestamp: { $gte: decemberStart, $lt: decemberEnd },
        "items.category": "Alcohol"
    }).count();
    
    console.log(`2. December transactions with alcohol: ${decemberWithAlcohol}`);
    
    // Test 3: Sample December alcohol transaction
    const sampleAlcohol = await transactions.findOne({
        timestamp: { $gte: decemberStart, $lt: decemberEnd },
        "items.category": "Alcohol"
    });
    
    console.log(`3. Sample December alcohol transaction timestamp: ${sampleAlcohol?.timestamp}`);
    
    // Test 4: Count our generated alcohol sales specifically
    const generatedAlcohol = await transactions.find({
        timestamp: { $gte: decemberStart, $lt: decemberEnd },
        "items.category": "Alcohol",
        "cashier": "December-Sales"
    }).count();
    
    console.log(`4. Generated December alcohol sales: ${generatedAlcohol}`);
    
    // Test 5: Recent December transactions (sorted by timestamp desc)
    const recentDecember = await transactions.find({
        timestamp: { $gte: decemberStart, $lt: decemberEnd }
    }).sort({ timestamp: -1 }).limit(10).toArray();
    
    console.log(`5. Recent December transactions (first 3):`);
    recentDecember.slice(0, 3).forEach((t, i) => {
        const hasAlcohol = t.items?.some(item => item.category === "Alcohol");
        console.log(`   ${i+1}. ${t.timestamp.toISOString()} - Alcohol: ${hasAlcohol}`);
    });
    
    await client.close();
}

testMongoQueries().catch(console.error);