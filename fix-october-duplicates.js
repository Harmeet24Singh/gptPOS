const { MongoClient } = require("mongodb");
require("dotenv").config();

async function fixOctoberDuplicates() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB);
    const collection = db.collection("transactions");

    console.log("🔧 Fixing October Duplicate Transactions\n");

    // Find all October transactions
    const octoberTransactions = await collection
      .find({
        $and: [
          { timestamp: { $gte: new Date("2025-10-01") } },
          { timestamp: { $lt: new Date("2025-11-01") } },
        ],
      })
      .toArray();

    console.log(`Found ${octoberTransactions.length} October transactions`);

    // Group by transactionId
    const transactionGroups = {};
    octoberTransactions.forEach((transaction) => {
      const transId = transaction.transactionId;
      if (!transactionGroups[transId]) {
        transactionGroups[transId] = [];
      }
      transactionGroups[transId].push(transaction);
    });

    console.log(
      `Grouped into ${Object.keys(transactionGroups).length} unique transactionIDs`,
    );

    let duplicatesRemoved = 0;
    let totalValueRemoved = 0;

    // Process each group
    for (const [transId, transactions] of Object.entries(transactionGroups)) {
      if (transactions.length > 1) {
        // Sort by timestamp (keep the most recent one)
        transactions.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
        );

        // Keep the first (most recent), remove the rest
        const toKeep = transactions[0];
        const toRemove = transactions.slice(1);

        console.log(
          `TransactionId ${transId}: Keeping ${toKeep.timestamp} ($${toKeep.total}), removing ${toRemove.length} duplicates`,
        );

        // Remove duplicates
        for (const duplicate of toRemove) {
          await collection.deleteOne({ _id: duplicate._id });
          duplicatesRemoved++;
          totalValueRemoved += parseFloat(duplicate.total || 0);
        }
      }
    }

    console.log(`\n✅ Cleanup Complete:`);
    console.log(`   Removed ${duplicatesRemoved} duplicate transactions`);
    console.log(`   Total value removed: $${totalValueRemoved.toFixed(2)}`);

    // Verify the fix
    const remainingTransactions = await collection
      .find({
        $and: [
          { timestamp: { $gte: new Date("2025-10-01") } },
          { timestamp: { $lt: new Date("2025-11-01") } },
        ],
      })
      .toArray();

    const newTotal = remainingTransactions.reduce(
      (sum, t) => sum + parseFloat(t.total || 0),
      0,
    );

    console.log(`\n📊 After Cleanup:`);
    console.log(`   Remaining transactions: ${remainingTransactions.length}`);
    console.log(`   New total sales: $${newTotal.toFixed(2)}`);
    console.log(`   Target was: $51,330.76`);
    console.log(`   Difference: $${(newTotal - 51330.76).toFixed(2)}`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

fixOctoberDuplicates();
