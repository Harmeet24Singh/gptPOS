const { upsertUser, connect } = require('./server/mongo');

async function addAdminUser() {
  try {
    console.log('Connecting to database...');
    await connect();
    
    const adminUser = {
      id: 'admin',
      password: 'admin123', // This will be stored as 'pwd' in database
      role: 'admin',
      email: 'admin@pos.local',
      active: true,
      permissions: {
        inventory: true,
        users: true,
        reports: true,
        pos: true,
        transactions: true
      }
    };
    
    console.log('Adding admin user...');
    await upsertUser(adminUser);
    
    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: admin');
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
  } finally {
    process.exit(0);
  }
}

addAdminUser();
