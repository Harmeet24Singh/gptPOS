const mongo = require('./server/mongo');

async function testAuthAPI() {
  console.log('Testing authentication API logic...\n');
  
  const testCredentials = {
    username: 'harmeet24singh@gmail.com',
    password: 'Canada.1'
  };
  
  console.log('Test credentials:', testCredentials);
  
  try {
    // Step 1: Get user from database
    console.log('\n🔍 Step 1: Getting user from database...');
    const user = await mongo.getUserByUsername(testCredentials.username);
    
    if (!user) {
      console.log('❌ User not found in database');
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      active: user.active,
      hasPassword: !!(user.pwd || user.password)
    });
    
    // Step 2: Check password
    console.log('\n🔐 Step 2: Password verification...');
    const userPassword = user.pwd || user.password || '';
    console.log('Stored password:', userPassword);
    console.log('Input password:', testCredentials.password);
    console.log('Passwords match:', userPassword === testCredentials.password);
    
    // Step 3: Test auth.js logic
    console.log('\n🧪 Step 3: Testing auth.js logic...');
    const users = await mongo.getUsers();
    const found = users.find((u) => {
      const userMatch = (u.username || u.id || '').toLowerCase() === testCredentials.username.toLowerCase();
      const passMatch = (u.password || u.pwd || '') === testCredentials.password;
      return userMatch && passMatch;
    });
    
    if (found) {
      console.log('✅ Auth.js logic would find user:', found.id);
    } else {
      console.log('❌ Auth.js logic would NOT find user');
      console.log('Available users:');
      users.forEach(u => {
        console.log(`  - ID: ${u.id}, Password: ${u.pwd || u.password || 'NONE'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
  
  process.exit(0);
}

testAuthAPI();