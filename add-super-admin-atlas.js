// Load environment variables first
require("dotenv").config();
const mongo = require("./server/mongo");

async function addSuperAdminToAtlas() {
  console.log("🔍 Adding super admin to MongoDB Atlas...\n");

  // Show connection details
  console.log(
    "MONGO_URI:",
    process.env.MONGO_URI || "mongodb://localhost:27017"
  );
  console.log("MONGO_DB:", process.env.MONGO_DB || "convenience_store");
  console.log("");

  const superAdmin = {
    id: "harmeet24singh@gmail.com",
    username: "harmeet24singh@gmail.com",
    email: "harmeet24singh@gmail.com",
    pwd: "Canada.1",
    role: "super_admin",
    active: true,
    permissions: {
      pos: true,
      inventory: true,
      users: true,
      reports: true,
      settings: true,
      admin: true,
      super_admin: true,
    },
  };

  try {
    console.log("📤 Adding user to Atlas database...");
    await mongo.upsertUser(superAdmin);
    console.log("✅ Super admin user added successfully to MongoDB Atlas!");
    console.log("Username:", superAdmin.username);
    console.log("Password:", superAdmin.pwd);
    console.log("Role:", superAdmin.role);

    // Verify the user was added
    console.log("\n🔍 Verifying user in Atlas database...");
    const savedUser = await mongo.getUserByUsername(superAdmin.username);
    if (savedUser) {
      console.log(
        "✅ User verification successful - user exists in Atlas database"
      );
      console.log("User ID:", savedUser.id);
      console.log("User Role:", savedUser.role);
    } else {
      console.log(
        "❌ User verification failed - user not found in Atlas database"
      );
    }

    // List all users in Atlas
    console.log("\n📋 All users in Atlas database:");
    const allUsers = await mongo.getUsers();
    console.log(`Found ${allUsers.length} users total`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.id} (${user.role})`);
    });
  } catch (error) {
    console.error("❌ Error adding super admin to Atlas:", error);
  }

  process.exit(0);
}

addSuperAdminToAtlas();
