// Simple migration trigger script
const https = require('http');

const postData = JSON.stringify({
  localStorageCategories: [
    // Add any localStorage categories that might exist
    { name: "Beverages", description: "Soft drinks and beverages" },
    { name: "Snacks", description: "Chips and snack foods" },
    { name: "Tobacco", description: "Cigarettes and tobacco products" },
    { name: "Dairy", description: "Milk and dairy products" },
    { name: "Fresh Produce", description: "Fruits and vegetables" }
  ]
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/migrate/categories',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🔄 Starting category migration...');

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.success) {
        console.log('🎉 Migration completed successfully!');
        console.log(`📊 Results:`);
        console.log(`   • ${result.added} categories added`);
        console.log(`   • ${result.updated} categories updated`);
        console.log(`   • ${result.total} total categories in database`);
        console.log('\n✅ All categories are now stored in MongoDB!');
      } else {
        console.error('❌ Migration failed:', result.error);
      }
    } catch (e) {
      console.error('❌ Error parsing response:', e.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
});

req.write(postData);
req.end();