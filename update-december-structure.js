const updateDecemberStructure = async () => {
  try {
    console.log("🔧 Updating December Data Structure to Match Other Months\n");

    // First, get all December transactions
    const response = await fetch(
      `http://localhost:3000/api/transaction?dateFilter=month&monthFilter=2025-12&limit=1000`,
      {
        headers: { "x-api-key": "dev-secret" },
      },
    );

    const decData = await response.json();
    console.log(`Found ${decData.length} December transactions to update`);

    const { MongoClient } = require("mongodb");
    require("dotenv").config();
    const client = new MongoClient(process.env.MONGO_URI);

    await client.connect();
    const db = client.db(process.env.MONGO_DB);
    const collection = db.collection("transactions");

    let updated = 0;
    let transactionIdCounter = 201900; // Start after November's highest

    // Update each December transaction
    for (const transaction of decData) {
      const updateDoc = {};

      // Add missing fields
      if (!transaction.transactionId) {
        updateDoc.transactionId = transactionIdCounter++;
      }

      if (!transaction.cashier) {
        updateDoc.cashier = "system";
      }

      if (!transaction.paymentMethod) {
        updateDoc.paymentMethod = Math.random() > 0.5 ? "card" : "cash";
      }

      // Add barcodes to items if missing
      if (transaction.items) {
        const updatedItems = transaction.items.map((item) => {
          if (!item.barcode) {
            // Generate barcode based on category
            let barcode;
            switch (item.category) {
              case "Alcohol":
                barcode =
                  "8" +
                  Math.floor(Math.random() * 100000000000)
                    .toString()
                    .padStart(11, "0");
                break;
              case "Grocery":
                barcode =
                  "8" +
                  Math.floor(Math.random() * 100000000000)
                    .toString()
                    .padStart(11, "0");
                break;
              case "Tobacco":
                barcode =
                  "9" +
                  Math.floor(Math.random() * 100000000000)
                    .toString()
                    .padStart(11, "0");
                break;
              case "Lotto":
                barcode = "LOTTO" + Math.floor(Math.random() * 1000000);
                break;
              default:
                barcode =
                  "8" +
                  Math.floor(Math.random() * 100000000000)
                    .toString()
                    .padStart(11, "0");
            }
            return { ...item, barcode };
          }
          return item;
        });
        updateDoc.items = updatedItems;
      }

      // Update the document if we have changes
      if (Object.keys(updateDoc).length > 0) {
        await collection.updateOne(
          { _id: transaction._id },
          { $set: updateDoc },
        );
        updated++;

        if (updated % 50 === 0) {
          console.log(`Updated ${updated} transactions...`);
        }
      }
    }

    console.log(`\n✅ Updated ${updated} December transactions`);
    console.log("   - Added transactionId to transactions missing it");
    console.log("   - Added 'system' as cashier for missing cashiers");
    console.log("   - Added random payment methods (50/50 cash/card)");
    console.log("   - Added barcodes to all items");

    await client.close();

    // Now check if alcohol exists and if not, add some
    console.log("\n🍺 Checking December Alcohol Sales...");
    const alcoholCheck = await fetch(
      `http://localhost:3000/api/transaction?dateFilter=month&monthFilter=2025-12&limit=1000`,
      {
        headers: { "x-api-key": "dev-secret" },
      },
    );

    const updatedData = await alcoholCheck.json();
    const alcoholCount = updatedData.filter((t) =>
      t.items?.some((item) => item.category === "Alcohol"),
    ).length;

    console.log(`December alcohol transactions: ${alcoholCount}`);

    if (alcoholCount === 0) {
      console.log(
        "⚠️  No alcohol sales found in December. December should have alcohol sales like other months.",
      );
      console.log(
        "   Consider running a script to add December alcohol sales to match seasonal patterns.",
      );
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

updateDecemberStructure();
