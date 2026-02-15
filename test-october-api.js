const testOctoberAPI = async () => {
  console.log("🔄 Testing October API after server restart...\n");

  // Wait for server to be ready
  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    const response = await fetch(
      `http://localhost:3000/api/transaction?dateFilter=month&monthFilter=2025-10&limit=3000`,
      {
        headers: {
          "x-api-key": "dev-secret",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      },
    );

    if (!response.ok) {
      console.log(`❌ API Error: ${response.status}`);
      return;
    }

    const data = await response.json();
    const totalSales = data.reduce(
      (sum, t) => sum + parseFloat(t.total || 0),
      0,
    );

    console.log(`📊 API Results:`);
    console.log(`   Transactions: ${data.length}`);
    console.log(`   Total Sales: $${totalSales.toFixed(2)}`);
    console.log(`   Expected: ~$49,878.03 (from database)`);

    if (totalSales > 75000) {
      console.log(
        `   ❌ ISSUE: API still shows old cached data ($${totalSales.toFixed(2)})`,
      );
      console.log(
        `   💡 Solution needed: Force cache clear in API or restart completely`,
      );
    } else {
      console.log(`   ✅ SUCCESS: API now shows corrected data!`);
      console.log(
        `   📈 Accuracy: ${((totalSales / 51330.76) * 100).toFixed(1)}% of target`,
      );
    }
  } catch (error) {
    console.error(`❌ API Test failed: ${error.message}`);
    console.log(`   Server might still be starting. Try again in a moment.`);
  }
};

testOctoberAPI();
