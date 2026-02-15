const { MongoClient } = require("mongodb");
require("dotenv").config();

async function thoroughOctoberCleanup() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB);
    const collection = db.collection("transactions");

    console.log("🧹 Thorough October Cleanup - Removing ALL Duplicates\n");

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
      if (!transId) {
        console.log(`⚠️  Transaction without ID: ${transaction._id}`);
        return;
      }

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

    // For each transactionId that has multiple entries, keep only ONE
    for (const [transId, transactions] of Object.entries(transactionGroups)) {
      if (transactions.length > 1) {
        console.log(
          `TransactionId ${transId} has ${transactions.length} entries`,
        );

        // Sort by timestamp and keep the latest one
        transactions.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
        );

        const toKeep = transactions[0];
        const toRemove = transactions.slice(1);

        console.log(`  Keeping: ${toKeep.timestamp} ($${toKeep.total})`);
        console.log(`  Removing ${toRemove.length} duplicates:`);

        // Remove all duplicates
        for (const duplicate of toRemove) {
          console.log(
            `    - ${duplicate.timestamp} ($${duplicate.total}) [${duplicate._id}]`,
          );
          await collection.deleteOne({ _id: duplicate._id });
          duplicatesRemoved++;
          totalValueRemoved += parseFloat(duplicate.total || 0);
        }
        console.log("");
      }
    }

    console.log(`✅ Cleanup Complete:`);
    console.log(`   Removed ${duplicatesRemoved} duplicate transactions`);
    console.log(`   Total value removed: $${totalValueRemoved.toFixed(2)}`);

    // Final verification
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
    const uniqueIds = new Set(remainingTransactions.map((t) => t.transactionId))
      .size;

    console.log(`\n📊 Final October Status:`);
    console.log(`   Remaining transactions: ${remainingTransactions.length}`);
    console.log(`   Unique transaction IDs: ${uniqueIds}`);
    console.log(`   New total sales: $${newTotal.toFixed(2)}`);
    console.log(`   Target was: $51,330.76`);
    console.log(`   Difference: $${(newTotal - 51330.76).toFixed(2)}`);

    const percentageOff = Math.abs((newTotal - 51330.76) / 51330.76) * 100;
    console.log(`   Accuracy: ${(100 - percentageOff).toFixed(2)}%`);

    if (percentageOff < 5) {
      console.log("\n🎉 SUCCESS: October sales now match target!");
    } else {
      console.log(`\n⚠️  Still off by ${percentageOff.toFixed(1)}%`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

thoroughOctoberCleanup();
