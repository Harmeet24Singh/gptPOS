const { MongoClient } = require("mongodb");
require("dotenv").config();

async function comprehensiveDecemberUpdate() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB);
    const collection = db.collection("transactions");

    console.log("🔄 Comprehensive December Data Update\n");

    // Find ALL December transactions without proper structure
    const incompleteTransactions = await collection
      .find({
        $and: [
          { timestamp: { $gte: new Date("2025-12-01") } },
          { timestamp: { $lt: new Date("2026-01-01") } },
          {
            $or: [
              { transactionId: { $exists: false } },
              { cashier: { $exists: false } },
              { paymentMethod: { $exists: false } },
              { "items.barcode": { $exists: false } },
            ],
          },
        ],
      })
      .toArray();

    console.log(
      `Found ${incompleteTransactions.length} December transactions needing updates`,
    );

    if (incompleteTransactions.length === 0) {
      console.log("✅ All December transactions are properly structured!");
      return;
    }

    // Get the highest existing transactionId to continue sequence
    const lastTransaction = await collection.findOne(
      { transactionId: { $exists: true } },
      { sort: { transactionId: -1 } },
    );

    let nextTransactionId = lastTransaction
      ? lastTransaction.transactionId + 1
      : 202400;
    console.log(`Starting transactionId sequence from: ${nextTransactionId}`);

    let updated = 0;
    const batchSize = 10;

    for (let i = 0; i < incompleteTransactions.length; i += batchSize) {
      const batch = incompleteTransactions.slice(i, i + batchSize);

      for (const transaction of batch) {
        const updateDoc = {};

        // Add transactionId if missing
        if (!transaction.transactionId) {
          updateDoc.transactionId = nextTransactionId++;
        }

        // Add cashier if missing
        if (!transaction.cashier) {
          updateDoc.cashier = "system";
        }

        // Add paymentMethod if missing
        if (!transaction.paymentMethod) {
          updateDoc.paymentMethod = Math.random() > 0.5 ? "card" : "cash";
        }

        // Fix items array - add barcodes
        if (
          transaction.items &&
          transaction.items.some((item) => !item.barcode)
        ) {
          const updatedItems = transaction.items.map((item) => {
            if (!item.barcode) {
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
                case "Beverages":
                  barcode =
                    "8" +
                    Math.floor(Math.random() * 100000000000)
                      .toString()
                      .padStart(11, "0");
                  break;
                case "Office Supplies":
                  barcode =
                    "8" +
                    Math.floor(Math.random() * 100000000000)
                      .toString()
                      .padStart(11, "0");
                  break;
                case "Lotto instant":
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

        // Update the document
        await collection.updateOne(
          { _id: transaction._id },
          { $set: updateDoc },
        );

        updated++;

        if (updated % 50 === 0) {
          console.log(
            `Updated ${updated}/${incompleteTransactions.length} transactions...`,
          );
        }
      }
    }

    console.log(`\n✅ Successfully updated ${updated} December transactions`);
    console.log("   - Added missing transactionId fields");
    console.log("   - Added missing cashier fields");
    console.log("   - Added missing paymentMethod fields");
    console.log("   - Added missing item barcodes");

    // Final verification
    const stillIncomplete = await collection.countDocuments({
      $and: [
        { timestamp: { $gte: new Date("2025-12-01") } },
        { timestamp: { $lt: new Date("2026-01-01") } },
        {
          $or: [
            { transactionId: { $exists: false } },
            { cashier: { $exists: false } },
            { paymentMethod: { $exists: false } },
          ],
        },
      ],
    });

    console.log(
      `\n📊 Verification: ${stillIncomplete} transactions still need updates`,
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

comprehensiveDecemberUpdate();
