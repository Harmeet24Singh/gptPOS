const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testAddUser() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB || 'convenience_store');
    
    console.log('🧪 Testing user creation directly with MongoDB...\n');
    
    // Test the upsertUser logic directly
    const newUser = {
      id: "manish",
      username: "manish",  // This should prevent the duplicate key error
      email: "manish@example.com",
      pwd: "password123",
      role: "Cashier",
      active: true,
      permissions_json: JSON.stringify({
        manageUsers: false,
        manageInventory: false,
        manageReports: false,
        managePOS: true
      })
    };
    
    console.log('Creating user:', newUser);
    
    // Simulate the upsertUser function
    const result = await db.collection("users").updateOne(
      { id: newUser.id },
      {
        $set: newUser
      },
      { upsert: true }
    );
    
    if (result.upsertedCount > 0) {
      console.log('✅ Successfully created new user:', newUser.id);
    } else if (result.modifiedCount > 0) {
      console.log('✅ Successfully updated existing user:', newUser.id);
    } else {
      console.log('ℹ️  User already exists with same data:', newUser.id);
    }
    
    // Verify the user was added
    const addedUser = await db.collection("users").findOne({ id: "manish" });
    console.log('\n📋 Verification - User in database:');
    console.log(`  id: ${addedUser.id}`);
    console.log(`  username: ${addedUser.username}`);
    console.log(`  email: ${addedUser.email}`);
    console.log(`  role: ${addedUser.role}`);
    
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    if (error.code === 11000) {
      console.log('💡 This is a duplicate key error - checking which field is causing the conflict...');
      console.log('Key pattern:', error.keyPattern);
      console.log('Key value:', error.keyValue);
    }
  } finally {
    await client.close();
  }
}

testAddUser();