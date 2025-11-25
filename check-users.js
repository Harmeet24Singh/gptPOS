require('dotenv').config(); // Load environment variables
const { connect } = require('./server/mongo');

async function checkUsersTable() {
  try {
    console.log('Connecting to database...');
    console.log(`MongoDB URI: ${process.env.MONGO_URI ? 'Atlas Cloud DB' : 'Local DB'}`);
    const db = await connect();
    
    console.log('Checking users collection...');
    const users = await db.collection('users').find({}).toArray();
    
    console.log(`\n📊 Users Table Contents (${users.length} users found):`);
    console.log('='.repeat(50));
    
    if (users.length === 0) {
      console.log('❌ No users found in the database');
    } else {
      users.forEach((user, index) => {
        console.log(`\n👤 User ${index + 1}:`);
        console.log(`   ID: ${user.id || 'N/A'}`);
        console.log(`   Username: ${user.username || 'N/A'}`);
        console.log(`   Password: ${user.pwd || user.password || 'N/A'}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Role: ${user.role || 'N/A'}`);
        console.log(`   Active: ${user.active !== undefined ? user.active : 'N/A'}`);
        console.log(`   Permissions: ${user.permissions_json || 'N/A'}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
    
  } catch (error) {
    console.error('❌ Failed to check users table:', error);
  } finally {
    process.exit(0);
  }
}

checkUsersTable();