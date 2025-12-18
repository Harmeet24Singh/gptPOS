require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB;

async function checkDatabase() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    console.log(`📂 Using database: ${dbName}`);

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(
      "📋 Collections in database:",
      collections.map((c) => c.name)
    );

    const collection = db.collection("transactions");

    // Check total count
    const totalCount = await collection.countDocuments();
    console.log(`📊 Total documents in transactions collection: ${totalCount}`);

    if (totalCount > 0) {
      // Get sample documents
      const sampleDocs = await collection.find().limit(3).toArray();
      console.log("\n🔍 Sample documents:");
      sampleDocs.forEach((doc, index) => {
        console.log(`Document ${index + 1}:`);
        console.log(`  ID: ${doc._id}`);
        console.log(`  Timestamp: ${doc.timestamp}`);
        console.log(`  Type: ${typeof doc.timestamp}`);
        console.log(
          `  Categories: ${
            doc.items
              ? doc.items.map((item) => item.category).join(", ")
              : "None"
          }`
        );
        console.log("");
      });

      // Check timestamp range
      const timestampStats = await collection
        .aggregate([
          {
            $group: {
              _id: null,
              minDate: { $min: "$timestamp" },
              maxDate: { $max: "$timestamp" },
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();

      if (timestampStats.length > 0) {
        console.log("📅 Timestamp range:");
        console.log(
          `  Earliest: ${timestampStats[0].minDate} (${typeof timestampStats[0]
            .minDate})`
        );
        console.log(
          `  Latest: ${timestampStats[0].maxDate} (${typeof timestampStats[0]
            .maxDate})`
        );
        console.log(`  Total: ${timestampStats[0].count}`);
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("\n🔒 Database connection closed");
  }
}

checkDatabase();
