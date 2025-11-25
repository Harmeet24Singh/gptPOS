import { NextResponse } from "next/server";
import { getCategories, saveCategory } from "../../../../server/mongo";

export async function POST(request) {
  try {
    console.log('🔄 Starting category migration to MongoDB...');
    
    // Check if categories already exist in MongoDB
    const existingCategories = await getCategories();
    console.log(`📊 Found ${existingCategories.length} categories in MongoDB`);
    
    // Get any additional categories from request body (from localStorage)
    let localStorageCategories = [];
    try {
      const body = await request.json();
      localStorageCategories = body.localStorageCategories || [];
      console.log(`📱 Found ${localStorageCategories.length} categories from localStorage`);
    } catch (e) {
      // No body provided, that's fine
    }
    
    // Define all categories that should exist (comprehensive list for convenience store)
    // This includes all standard categories plus any that might have been in localStorage
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
      { id: 20, name: "Lottery", description: "Lottery tickets and scratch cards" },
      { id: 21, name: "Frozen", description: "Frozen food items and ice products" },
      { id: 22, name: "Uncategorized", description: "Items without a specific category" }
    ];

    // Add localStorage categories to our list (with higher IDs)
    let nextId = 23;
    const additionalCategories = localStorageCategories
      .filter(lsCat => !allCategories.some(cat => cat.name.toLowerCase() === lsCat.name.toLowerCase()))
      .map(lsCat => ({
        id: nextId++,
        name: lsCat.name,
        description: lsCat.description || `${lsCat.name} products and related items`
      }));
    
    const finalCategories = [...allCategories, ...additionalCategories];
    console.log(`📋 Will ensure ${finalCategories.length} categories exist in database (${allCategories.length} standard + ${additionalCategories.length} from localStorage)`);

    let addedCount = 0;
    let updatedCount = 0;

    for (const category of finalCategories) {
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

    console.log('🎉 Category migration completed!');
    console.log(`📊 Summary: ${addedCount} added, ${updatedCount} updated`);
    
    // Get final count
    const updatedCategoriesList = await getCategories();
    console.log(`📈 Total categories in database: ${updatedCategoriesList.length}`);
    
    return NextResponse.json({
      success: true,
      message: 'Categories migration completed successfully',
      added: addedCount,
      updated: updatedCount,
      total: updatedCategoriesList.length,
      categories: updatedCategoriesList
    });

  } catch (error) {
    console.error('❌ Error migrating categories:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}