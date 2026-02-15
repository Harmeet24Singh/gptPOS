const { MongoClient } = require("mongodb");
require("dotenv").config();

async function verifyDecemberAlcohol() {
  const client = new MongoClient(
    process.env.MONGO_URI || "mongodb://localhost:27017",
  );

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("convenience_store");
    const collection = db.collection("transactions");

    // Check transactions with 'December-Sales' cashier
    const decemberAlcohol = await collection
      .find({
        cashier: "December-Sales",
      })
      .toArray();

    console.log("\n🍷 December Alcohol Sales Verification:");
    console.log("Transactions found:", decemberAlcohol.length);

    if (decemberAlcohol.length > 0) {
      console.log("\n📄 Sample transaction:");
      const sample = decemberAlcohol[0];
      console.log("Date:", sample.timestamp);
      console.log("Items:", sample.items.length);
      sample.items.forEach((item) => {
        console.log(
          `  - ${item.name} (${item.category}) $${item.price} x${item.quantity}`,
        );
      });
      console.log("Total: $" + sample.total.toFixed(2));
    }

    const totalSales = decemberAlcohol.reduce((sum, t) => sum + t.total, 0);
    console.log("\n💰 Total December alcohol sales: $" + totalSales.toFixed(2));
    console.log("🎯 Target was: $8,500.00");
    console.log(
      "📊 Achievement: " + ((totalSales / 8500) * 100).toFixed(1) + "%",
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("\n🔒 Database connection closed");
  }
}

verifyDecemberAlcohol();
