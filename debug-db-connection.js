const { MongoClient } = require("mongodb");
require("dotenv").config();

async function debugDatabaseConnection() {
    console.log("🔍 Database Connection Debug Report\n");
    
    // Check environment variables
    console.log("📋 Environment Variables:");
    console.log(`   MONGO_URI: ${process.env.MONGO_URI ? 'SET' : 'NOT SET'}`);
    if (process.env.MONGO_URI) {
        const uri = process.env.MONGO_URI;
        if (uri.includes('localhost')) {
            console.log(`   Connection: LOCAL (${uri})`);
        } else if (uri.includes('mongodb+srv')) {
            const cluster = uri.match(/@([^/]+)/)?.[1] || 'unknown';
            console.log(`   Connection: ATLAS (${cluster})`);
        } else {
            console.log(`   Connection: OTHER (${uri.substring(0, 50)}...)`);
        }
    }
    console.log(`   MONGO_DB: ${process.env.MONGO_DB || 'convenience_store (default)'}`);
    
    // Test connection
    try {
        const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
        const dbName = process.env.MONGO_DB || "convenience_store";
        
        console.log("\n🔗 Testing Connection...");
        const client = new MongoClient(uri);
        await client.connect();
        
        const db = client.db(dbName);
        
        // Get basic database info
        const collections = await db.listCollections().toArray();
        const transactionCount = await db.collection("transactions").countDocuments();
        
        console.log("✅ Connection successful!");
        console.log(`📊 Database: ${dbName}`);
        console.log(`📁 Collections: ${collections.map(c => c.name).join(', ')}`);
        console.log(`📈 Total transactions: ${transactionCount}`);
        
        // Check specific months
        const months = [
            { name: "October", start: "2025-10-01", end: "2025-11-01" },
            { name: "November", start: "2025-11-01", end: "2025-12-01" },
            { name: "December", start: "2025-12-01", end: "2026-01-01" }
        ];
        
        console.log("\n📅 Monthly breakdown:");
        for (const month of months) {
            const count = await db.collection("transactions").countDocuments({
                timestamp: { 
                    $gte: month.start + "T00:00:00.000Z", 
                    $lt: month.end + "T00:00:00.000Z" 
                }
            });
            console.log(`   ${month.name} 2025: ${count} transactions`);
        }
        
        // Check for November data with different criteria
        console.log("\n🔎 Detailed November search:");
        
        // Search by different timestamp formats
        const novSearches = [
            { name: "String format", query: { timestamp: { $gte: "2025-11-01T00:00:00.000Z", $lt: "2025-12-01T00:00:00.000Z" } } },
            { name: "Date objects", query: { timestamp: { $gte: new Date("2025-11-01"), $lt: new Date("2025-12-01") } } },
            { name: "Contains Nov 2025", query: { timestamp: { $regex: "2025-11" } } },
            { name: "Admin User cashier", query: { cashier: "Admin User", timestamp: { $regex: "2025-11" } } },
            { name: "TransactionId range", query: { transactionId: { $gte: 110800, $lt: 111800 } } }
        ];
        
        for (const search of novSearches) {
            try {
                const count = await db.collection("transactions").countDocuments(search.query);
                console.log(`   ${search.name}: ${count} results`);
            } catch (err) {
                console.log(`   ${search.name}: ERROR - ${err.message}`);
            }
        }
        
        // Check what cashier names exist
        const cashiers = await db.collection("transactions").distinct("cashier");
        console.log(`\n👤 Cashiers in database: ${cashiers.join(', ')}`);
        
        await client.close();
        
    } catch (error) {
        console.log("❌ Connection failed!");
        console.log(`Error: ${error.message}`);
        
        // Check if .env file exists
        const fs = require('fs');
        const envExists = fs.existsSync('.env');
        console.log(`📄 .env file exists: ${envExists}`);
        
        if (!envExists) {
            console.log("⚠️  .env file not found - using localhost fallback");
        }
    }
    
    console.log("\n💡 Possible reasons for different results on other PC:");
    console.log("   1. Different .env file with different MONGO_URI");
    console.log("   2. Other PC using localhost MongoDB with different data");
    console.log("   3. Other PC reading from localStorage instead of database");
    console.log("   4. Different git branch with different database settings");
    console.log("   5. Network connectivity issues to Atlas cluster");
}

debugDatabaseConnection().catch(console.error);