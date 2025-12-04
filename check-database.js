const mongo = require("./server/mongo");

async function checkDatabase() {
  console.log("🔍 Database Connection Check\n");

  // Show connection details
  console.log(
    "MONGO_URI:",
    process.env.MONGO_URI || "mongodb://localhost:27017"
  );
  console.log("MONGO_DB:", process.env.MONGO_DB || "convenience_store");
  console.log("");

  try {
    // Get all users
    console.log("📋 All users in database:");
    const users = await mongo.getUsers();

    if (users.length === 0) {
      console.log("❌ No users found in database!");
    } else {
      console.log(`✅ Found ${users.length} users:`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   Email: ${user.email || "N/A"}`);
        console.log(`   Role: ${user.role || "N/A"}`);
        console.log(`   Password: ${user.pwd || user.password || "N/A"}`);
        console.log("   ---");
      });
    }

    // Specifically test our user
    console.log("\n🔍 Testing specific user lookup:");
    const testUser = await mongo.getUserByUsername("harmeet24singh@gmail.com");
    if (testUser) {
      console.log("✅ Found harmeet24singh@gmail.com:", testUser.id);
    } else {
      console.log("❌ harmeet24singh@gmail.com NOT found");
    }
  } catch (error) {
    console.error("❌ Database error:", error.message);
  }

  process.exit(0);
}

checkDatabase();
