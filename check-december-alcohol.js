const mongo = require("./server/mongo");

async function checkDecemberData() {
  try {
    await mongo.connect();

    const decemberStart = new Date("2025-12-01T00:00:00.000Z");
    const decemberEnd = new Date("2026-01-01T00:00:00.000Z");

    const transactions = await mongo.getTransactions({
      startDate: decemberStart.toISOString().split("T")[0],
      endDate: decemberEnd.toISOString().split("T")[0],
    });

    console.log("📊 December 2025 Current Sales Data:");
    console.log("Total Transactions:", transactions.length);

    let alcoholTotal = 0;
    let alcoholTransactions = 0;

    transactions.forEach((t) => {
      if (t.items && Array.isArray(t.items)) {
        let hasAlcohol = false;
        let alcoholAmount = 0;

        t.items.forEach((item) => {
          if (item.category === "Alcohol") {
            hasAlcohol = true;
            alcoholAmount += (item.price || 0) * (item.quantity || 0);
          }
        });

        if (hasAlcohol) {
          alcoholTotal += alcoholAmount;
          alcoholTransactions++;
        }
      }
    });

    console.log("🍷 Alcohol Sales:");
    console.log("Current Total: $" + alcoholTotal.toFixed(2));
    console.log("Transactions: " + alcoholTransactions);
    console.log("Target: ~$8,500.00");
    console.log("Needed: $" + (8500 - alcoholTotal).toFixed(2));

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkDecemberData();
