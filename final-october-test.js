const finalOctoberTest = async () => {
  try {
    console.log("🏆 FINAL OCTOBER TEST\n");

    const response = await fetch(
      `http://localhost:3000/api/transaction?dateFilter=month&monthFilter=2025-10&limit=5000`,
      {
        headers: { "x-api-key": "dev-secret" },
      },
    );

    const data = await response.json();

    // Calculate totals
    const totalSales = data.reduce(
      (sum, t) => sum + parseFloat(t.total || 0),
      0,
    );

    // Check for duplicates
    const transactionIds = new Set();
    let duplicates = 0;

    data.forEach((transaction) => {
      if (transactionIds.has(transaction.transactionId)) {
        duplicates++;
      } else {
        transactionIds.add(transaction.transactionId);
      }
    });

    // Category breakdown
    const categories = {};
    data.forEach((transaction) => {
      if (transaction.items) {
        transaction.items.forEach((item) => {
          const cat = item.category || "Uncategorized";
          if (!categories[cat]) categories[cat] = 0;
          categories[cat] += parseFloat(item.price || 0);
        });
      }
    });

    console.log("📊 OCTOBER FINAL RESULTS:");
    console.log(`   ✅ Total Transactions: ${data.length}`);
    console.log(`   ✅ Unique IDs: ${transactionIds.size}`);
    console.log(
      `   ✅ No Duplicates: ${duplicates === 0 ? "YES" : `NO (${duplicates} found)`}`,
    );
    console.log(`   💰 Total Sales: $${totalSales.toFixed(2)}`);
    console.log(`   🎯 Target Sales: $51,330.76`);
    console.log(
      `   📈 Accuracy: ${((totalSales / 51330.76) * 100).toFixed(1)}%`,
    );

    const difference = totalSales - 51330.76;
    if (Math.abs(difference) < 2000) {
      console.log(
        `   🎉 STATUS: FIXED! (Difference: $${difference.toFixed(2)})`,
      );
    } else {
      console.log(
        `   ❌ STATUS: Still needs work (Difference: $${difference.toFixed(2)})`,
      );
    }

    console.log("\n📋 Top Categories:");
    Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([cat, sales]) => {
        console.log(`   ${cat}: $${sales.toFixed(2)}`);
      });

    // Compare with other months
    console.log("\n🔍 COMPARISON WITH OTHER MONTHS:");
    const months = [
      { name: "November", filter: "2025-11" },
      { name: "December", filter: "2025-12" },
    ];

    for (const month of months) {
      const monthResponse = await fetch(
        `http://localhost:3000/api/transaction?dateFilter=month&monthFilter=${month.filter}&limit=5000`,
        {
          headers: { "x-api-key": "dev-secret" },
        },
      );

      const monthData = await monthResponse.json();
      const monthTotal = monthData.reduce(
        (sum, t) => sum + parseFloat(t.total || 0),
        0,
      );

      console.log(
        `   ${month.name}: ${monthData.length} transactions, $${monthTotal.toFixed(2)}`,
      );
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
};

finalOctoberTest();
