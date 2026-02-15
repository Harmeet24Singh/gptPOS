// Simple direct test
fetch(
  `http://localhost:3000/api/transaction?dateFilter=month&monthFilter=2025-10&limit=3000`,
  {
    headers: { "x-api-key": "dev-secret" },
  },
)
  .then((response) => response.json())
  .then((data) => {
    const total = data.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
    console.log(`🔍 OCTOBER RESULTS:`);
    console.log(`   Transactions: ${data.length}`);
    console.log(`   Total: $${total.toFixed(2)}`);
    console.log(`   Target: $51,330.76`);

    if (total > 75000) {
      console.log(`   ❌ Still showing cached data: $${total.toFixed(2)}`);
    } else {
      console.log(
        `   ✅ Fixed! Close to target (diff: $${(total - 51330.76).toFixed(2)})`,
      );
    }
  })
  .catch((err) => {
    console.error("Error:", err.message);
    console.log("Server may not be ready yet. Wait a moment and try again.");
  });
