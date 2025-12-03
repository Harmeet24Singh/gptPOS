const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkUsernames() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB || 'convenience_store');
    
    console.log('🔍 Checking existing users and their username fields...\n');
    
    const users = await db.collection('users').find({}).toArray();
    console.log(`Found ${users.length} users in database:\n`);
    
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  id: ${user.id}`);
      console.log(`  username: ${user.username}`);
      console.log(`  email: ${user.email}`);
      console.log(`  role: ${user.role}`);
      console.log('');
    });
    
    // Check for any indexes on the users collection
    console.log('�� Checking indexes on users collection:');
    const indexes = await db.collection('users').listIndexes().toArray();
    indexes.forEach((index) => {
      console.log(`  Index: ${index.name} - Keys: ${JSON.stringify(index.key)}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkUsernames();
