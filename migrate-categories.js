const { getCategories, saveCategory } = require('./server/mongo');

async function migrateCategoriesToDB() {
  console.log('🔄 Starting category migration to MongoDB...');
  
  try {
    // Check if categories already exist in MongoDB
    const existingCategories = await getCategories();
    console.log(`📊 Found ${existingCategories.length} categories in MongoDB`);
    
    // Define all categories that should exist (including any that might be in localStorage)
    const allCategories = [
      { id: 1, name: "Beverages", description: "Soft drinks, energy drinks, water, and other beverages" },
      { id: 2, name: "Snacks", description: "Chips, crackers, nuts, and other snack foods" },
      { id: 3, name: "Bakery", description: "Bread, pastries, and baked goods" },
      { id: 4, name: "Tobacco", description: "Cigarettes and tobacco products" },
      { id: 5, name: "Dairy", description: "Milk, cheese, yogurt, and dairy products" },
      { id: 6, name: "Frozen Foods", description: "Ice cream, frozen meals, and frozen items" },
      { id: 7, name: "Personal Care", description: "Toiletries, hygiene, and personal care items" },
      { id: 8, name: "Household", description: "Cleaning supplies, paper products, and household items" },
      { id: 9, name: "Fresh Produce", description: "Fruits, vegetables, and fresh produce" },
      { id: 10, name: "Candy", description: "Chocolates, gums, and sweet treats" },
      { id: 11, name: "Alcohol", description: "Beer, wine, and alcoholic beverages" },
      { id: 12, name: "Health & Beauty", description: "Health supplements, beauty products, and cosmetics" },
      { id: 13, name: "Electronics", description: "Phone accessories, batteries, and small electronics" },
      { id: 14, name: "Automotive", description: "Car accessories, motor oil, and automotive supplies" },
      { id: 15, name: "Pet Supplies", description: "Pet food, treats, and pet care products" },
      { id: 16, name: "Office Supplies", description: "Stationery, notebooks, and office materials" },
      { id: 17, name: "Toys & Games", description: "Small toys, games, and entertainment items" },
      { id: 18, name: "Seasonal", description: "Holiday and seasonal merchandise" },
      { id: 19, name: "Pharmacy", description: "Over-the-counter medications and first aid" },
      { id: 20, name: "Lottery", description: "Lottery tickets and scratch cards" }
    ];

    console.log(`📋 Will ensure ${allCategories.length} categories exist in database`);

    let addedCount = 0;
    let updatedCount = 0;

    for (const category of allCategories) {
      const existing = existingCategories.find(c => c.name === category.name || c.id === category.id);
      
      if (existing) {
        // Update if description is different or missing
        if (!existing.description || existing.description !== category.description) {
          await saveCategory({
            id: existing.id,
            name: category.name,
            description: category.description
          });
          console.log(`✅ Updated category: ${category.name}`);
          updatedCount++;
        } else {
          console.log(`⏭️  Skipped existing category: ${category.name}`);
        }
      } else {
        // Add new category
        await saveCategory({
          id: category.id,
          name: category.name,
          description: category.description
        });
        console.log(`➕ Added new category: ${category.name}`);
        addedCount++;
      }
    }

    console.log('\n🎉 Category migration completed!');
    console.log(`📊 Summary:`);
    console.log(`   • ${addedCount} categories added`);
    console.log(`   • ${updatedCount} categories updated`);
    console.log(`   • ${existingCategories.length - updatedCount} categories unchanged`);
    
    // Get final count
    const finalCategories = await getCategories();
    console.log(`📈 Total categories in database: ${finalCategories.length}`);
    
    return {
      success: true,
      added: addedCount,
      updated: updatedCount,
      total: finalCategories.length
    };

  } catch (error) {
    console.error('❌ Error migrating categories:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateCategoriesToDB()
    .then((result) => {
      if (result.success) {
        console.log('\n✨ Category migration successful!');
        process.exit(0);
      } else {
        console.error('\n💥 Category migration failed:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { migrateCategoriesToDB };