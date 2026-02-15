const { MongoClient } = require("mongodb");
require("dotenv").config();

async function testGetTransactionsLogic() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
  const dbName = process.env.MONGO_DB || "convenience_store";

  console.log("Connecting to:", uri);

  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db(dbName);

  // Replicate exact getTransactions logic for December 2025
  const monthFilter = "2025-12";
  const limit = 1000;
  const dateFilter = "month";

  let dateQuery = {};

  if (dateFilter && dateFilter !== "all") {
    if (dateFilter === "month" && monthFilter) {
      const [year, month] = monthFilter.split("-");
      const monthStart = new Date(
        `${year}-${month.padStart(2, "0")}-01T00:00:00.000Z`,
      );
      const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
      const nextYear =
        parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
      const monthEnd = new Date(
        `${nextYear}-${nextMonth.toString().padStart(2, "0")}-01T00:00:00.000Z`,
      );

      dateQuery = {
        timestamp: {
          $gte: monthStart,
          $lt: monthEnd,
        },
      };

      console.log("Date query:", JSON.stringify(dateQuery, null, 2));
    }
  }

  // Use timestamp sorting when filtering by date
  const sortField =
    dateFilter && dateFilter !== "all" ? { timestamp: -1 } : { _id: -1 };

  console.log("Sort field:", sortField);

  const cursor = db
    .collection("transactions")
    .find(dateQuery)
    .sort(sortField)
    .limit(Number(limit));

  const rows = await cursor.toArray();

  console.log(`Total transactions found: ${rows.length}`);

  if (rows.length > 0) {
    console.log("First transaction timestamp:", rows[0].timestamp);
    console.log("Last transaction timestamp:", rows[rows.length - 1].timestamp);

    const alcoholTransactions = rows.filter((transaction) => {
      return (
        transaction.items &&
        Array.isArray(transaction.items) &&
        transaction.items.some((item) => item.category === "Alcohol")
      );
    });

    console.log(`Alcohol transactions: ${alcoholTransactions.length}`);

    if (alcoholTransactions.length > 0) {
      console.log("First alcohol transaction:", {
        timestamp: alcoholTransactions[0].timestamp,
        cashier: alcoholTransactions[0].cashier,
        items: alcoholTransactions[0].items
          .filter((item) => item.category === "Alcohol")
          .map((item) => item.name),
      });
    }
  }

  await client.close();
}

testGetTransactionsLogic().catch(console.error);
