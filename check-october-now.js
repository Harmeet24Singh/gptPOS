const checkOctoberNow = async () => {
  try {
    console.log("🔍 Checking Current October Sales...\n");

    // Give server a moment to fully start
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const response = await fetch(
      `http://localhost:3000/api/transaction?dateFilter=month&monthFilter=2025-10&limit=5000`,
      {
        headers: { "x-api-key": "dev-secret" },
      },
    );

    if (!response.ok) {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();

    const totalSales = data.reduce(
      (sum, t) => sum + parseFloat(t.total || 0),
      0,
    );

    // Check for duplicates
    const transactionIds = new Set();
    let duplicatesFound = 0;

    data.forEach((transaction) => {
      if (transactionIds.has(transaction.transactionId)) {
        duplicatesFound++;
      } else {
        transactionIds.add(transaction.transactionId);
      }
    });

    console.log("📊 OCTOBER CURRENT STATUS:");
    console.log(`   Total Transactions: ${data.length}`);
    console.log(`   Unique Transaction IDs: ${transactionIds.size}`);
    console.log(`   Duplicates Found: ${duplicatesFound}`);
    console.log(`   💰 Total Sales: $${totalSales.toFixed(2)}`);
    console.log(`   🎯 Target: $51,330.76`);

    if (totalSales > 75000) {
      console.log(
        `   ❌ STATUS: Still showing incorrect amount ($${totalSales.toFixed(2)})`,
      );
      console.log(
        `   📝 The duplicates are still there. Database cleanup may not have worked.`,
      );
    } else if (Math.abs(totalSales - 51330.76) < 5000) {
      console.log(
        `   ✅ STATUS: Much better! Close to target (difference: $${(totalSales - 51330.76).toFixed(2)})`,
      );
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
};

checkOctoberNow();
