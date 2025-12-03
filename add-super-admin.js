const mongo = require('./server/mongo');

async function addSuperAdmin() {
  console.log('Adding super admin user...');
  
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

  try {
    await mongo.upsertUser(superAdmin);
    console.log('✅ Super admin user added successfully!');
    console.log('Username:', superAdmin.username);
    console.log('Password:', superAdmin.pwd);
    console.log('Role:', superAdmin.role);
    console.log('Permissions:', Object.keys(superAdmin.permissions).filter(key => superAdmin.permissions[key]));
    
    // Verify the user was added
    const savedUser = await mongo.getUserByUsername(superAdmin.username);
    if (savedUser) {
      console.log('✅ User verification successful - user exists in database');
    } else {
      console.log('❌ User verification failed - user not found in database');
    }
    
  } catch (error) {
    console.error('❌ Error adding super admin:', error);
  }
  
  process.exit(0);
}

addSuperAdmin();