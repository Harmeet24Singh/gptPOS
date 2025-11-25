require('dotenv').config(); // Load environment variables
const { getUsers, upsertUser, connect } = require('./server/mongo');

async function checkAndAddCashier() {
  try {
    console.log('Connecting to database...');
    await connect();
    
    console.log('Checking current users in database...');
    const users = await getUsers();
    
    console.log(`\n📊 Current Users (${users.length} found):`);
    console.log('='.repeat(50));
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      console.log('🔄 Auto-creation should happen when you access /api/users');
    } else {
      users.forEach((user, index) => {
        console.log(`\n👤 User ${index + 1}:`);
        console.log(`   ID: ${user.id || 'N/A'}`);
        console.log(`   Username: ${user.username || 'N/A'}`);
        console.log(`   Role: ${user.role || 'N/A'}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Active: ${user.active !== undefined ? user.active : 'N/A'}`);
      });
    }
    
    // Check if cashier exists
    const cashierExists = users.some(user => 
      (user.id === 'cashier' || user.username === 'cashier')
    );
    
    if (!cashierExists) {
      console.log('\n🔧 Cashier user not found. Creating now...');
      
      const cashierUser = {
        id: 'cashier',
        password: 'cashier1', // This will be stored as 'pwd' in database
        role: 'Cashier',
        email: 'cashier@pos.local',
        active: true,
        permissions: {
          inventory: false,
          users: false,
          reports: false,
          pos: true,
          transactions: false,
          manageUsers: false,
          manageInventory: false,
          manageReports: false,
          managePOS: true
        }
      };
      
      await upsertUser(cashierUser);
      console.log('✅ Cashier user created successfully!');
      console.log('   Username: cashier');
      console.log('   Password: cashier1');
      console.log('   Role: Cashier');
      
      // Show updated user list
      const updatedUsers = await getUsers();
      console.log(`\n📊 Updated Users (${updatedUsers.length} total):`);
      updatedUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username} (${user.role})`);
      });
    } else {
      console.log('\n✅ Cashier user already exists');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAndAddCashier();