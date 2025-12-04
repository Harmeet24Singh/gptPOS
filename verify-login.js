const mongo = require("./server/mongo");

async function verifyLogin() {
  const username = "harmeet24singh@gmail.com";
  const password = "Canada.1";

  console.log("Testing login for:", username);

  try {
    // Get user from database
    const user = await mongo.getUserByUsername(username);

    if (!user) {
      console.log("❌ User not found in database");
      return;
    }

    console.log("\n📋 User details found:");
    console.log("ID:", user.id);
    console.log("Email:", user.email);
    console.log("Role:", user.role);
    console.log("Active:", user.active);

    // Parse permissions
    let permissions = {};
    try {
      permissions = JSON.parse(user.permissions_json || "{}");
    } catch (e) {
      permissions = {};
    }
    console.log(
      "Permissions:",
      Object.keys(permissions).filter((key) => permissions[key])
    );

    // Check password
    const userPassword = user.pwd || user.password || "";
    if (userPassword === password) {
      console.log("\n✅ Password verification: SUCCESS");
      console.log("🔐 Login credentials are valid!");
    } else {
      console.log("\n❌ Password verification: FAILED");
      console.log("Expected:", password);
      console.log("Found:", userPassword);
    }
  } catch (error) {
    console.error("❌ Error during verification:", error);
  }

  process.exit(0);
}

verifyLogin();
