const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixNullUsername() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB || 'convenience_store');
    
    console.log('🔧 Fixing users with null usernames...\n');
    
    // Find users with null or undefined username
    const usersWithNullUsername = await db.collection('users').find({
      $or: [
        { username: null },
        { username: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`Found ${usersWithNullUsername.length} users with null usernames:`);
    
    for (const user of usersWithNullUsername) {
      console.log(`\n  Fixing user: ${user.id}`);
      
      // Update the username to match the id
      const result = await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { username: user.id } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`  ✅ Successfully updated username to: ${user.id}`);
      } else {
        console.log(`  ⚠️  Failed to update user: ${user.id}`);
      }
    }
    
    console.log('\n🎉 Username fixing completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixNullUsername();
