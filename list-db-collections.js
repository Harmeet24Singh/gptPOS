const { MongoClient } = require("mongodb");

async function listDatabasesAndCollections() {
    const client = new MongoClient("mongodb://localhost:27017");
    await client.connect();
    
    // List all databases
    const dbs = await client.db().admin().listDatabases();
    console.log("Available databases:");
    dbs.databases.forEach(db => {
        console.log(`- ${db.name}`);
    });
    
    // Check convenience_store database specifically
    const db = client.db("convenience_store");
    const collections = await db.listCollections().toArray();
    console.log("\nCollections in convenience_store:");
    collections.forEach(coll => {
        console.log(`- ${coll.name}`);
    });
    
    // Check if there are transactions in the transactions collection
    const transactionCount = await db.collection("transactions").countDocuments();
    console.log(`\nTotal transactions in collection: ${transactionCount}`);
    
    // Check for any alcohol-related transactions
    const alcoholCount = await db.collection("transactions").countDocuments({
        "items.category": "Alcohol"
    });
    console.log(`Alcohol transactions: ${alcoholCount}`);
    
    // Get a sample transaction
    const sample = await db.collection("transactions").findOne();
    console.log("\nSample transaction structure:");
    console.log(JSON.stringify(sample, null, 2));
    
    await client.close();
}

listDatabasesAndCollections().catch(console.error);