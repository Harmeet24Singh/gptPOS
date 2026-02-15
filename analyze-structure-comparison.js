const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://harmeet24singh:harmeet24singh@cluster0.a2m0kky.mongodb.net/";

const analyzeDataStructure = async () => {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const db = client.db('convenience_store');
        const collection = db.collection('transactions');
        
        console.log("📊 Analyzing Data Structure Across Months\n");
        
        // October sample
        const octSample = await collection.findOne({
            $and: [
                { timestamp: { $gte: new Date('2025-10-01') } },
                { timestamp: { $lt: new Date('2025-11-01') } }
            ]
        });
        
        // November sample  
        const novSample = await collection.findOne({
            $and: [
                { timestamp: { $gte: new Date('2025-11-01') } },
                { timestamp: { $lt: new Date('2025-12-01') } }
            ]
        });
        
        // December sample
        const decSample = await collection.findOne({
            $and: [
                { timestamp: { $gte: new Date('2025-12-01') } },
                { timestamp: { $lt: new Date('2026-01-01') } }
            ]
        });
        
        const analyzeStructure = (sample, monthName) => {
            if (!sample) {
                console.log(`❌ ${monthName}: No data found\n`);
                return;
            }
            
            console.log(`📅 ${monthName} Structure:`);
            console.log(`   ID: ${sample._id}`);
            console.log(`   transactionId: ${sample.transactionId || 'MISSING'}`);
            console.log(`   timestamp: ${sample.timestamp} (type: ${typeof sample.timestamp})`);
            console.log(`   cashier: ${sample.cashier || 'MISSING'}`);
            console.log(`   paymentMethod: ${sample.paymentMethod}`);
            console.log(`   total: ${sample.total}`);
            
            if (sample.items && sample.items.length > 0) {
                const item = sample.items[0];
                console.log(`   Sample item:`);
                console.log(`     name: ${item.name}`);
                console.log(`     category: ${item.category}`);
                console.log(`     barcode: ${item.barcode || 'MISSING'}`);
                console.log(`     price: ${item.price}`);
            }
            console.log("");
        };
        
        analyzeStructure(octSample, "October");
        analyzeStructure(novSample, "November");  
        analyzeStructure(decSample, "December");
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
};

analyzeDataStructure();