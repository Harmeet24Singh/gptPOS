// Load environment variables first
require('dotenv').config();
const mongo = require('./server/mongo');

async function cleanupAndAddUser() {
  console.log('🔍 Cleaning up MongoDB Atlas and adding super admin...\n');
  
  console.log('MONGO_URI:', process.env.MONGO_URI.substring(0, 50) + '...');
  console.log('MONGO_DB:', process.env.MONGO_DB);
  console.log('');

  try {
    // First, let's see what's in the database
    console.log('📋 Current users in Atlas:');
    const currentUsers = await mongo.getUsers();
    console.log(`Found ${currentUsers.length} users`);
    currentUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Username: ${user.username || 'NULL'}, Email: ${user.email}`);
    });

    // Clean up any users with null/empty usernames or IDs
    console.log('\n🧹 Cleaning up users with null usernames...');
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db(process.env.MONGO_DB);
    
    // Remove users with null/empty username or id
    const deleteResult = await db.collection('users').deleteMany({
      $or: [
        { username: null },
        { username: "" },
        { id: null },
        { id: "" },
        { id: { $exists: false } },
        { username: { $exists: false } }
      ]
    });
    
    console.log(`✅ Cleaned up ${deleteResult.deletedCount} problematic users`);
    
    // Now add the super admin
    const superAdmin = {
      id: 'harmeet24singh@gmail.com',
      username: 'harmeet24singh@gmail.com', 
      email: 'harmeet24singh@gmail.com',
      pwd: 'Canada.1',
      role: 'super_admin',
      active: true,
      permissions: {
        pos: true,
        inventory: true,
        users: true,
        reports: true,
        settings: true,
        admin: true,
        super_admin: true
      }
    };

    console.log('\n📤 Adding super admin user...');
    await mongo.upsertUser(superAdmin);
    console.log('✅ Super admin added successfully!');
    
    // Verify
    console.log('\n🔍 Verifying user...');
    const savedUser = await mongo.getUserByUsername(superAdmin.username);
    if (savedUser) {
      console.log('✅ User verification successful!');
      console.log('  Username:', savedUser.username);
      console.log('  Role:', savedUser.role);
      console.log('  Active:', savedUser.active);
    } else {
      console.log('❌ User verification failed');
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

cleanupAndAddUser();