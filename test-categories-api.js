// Test script to check categories API
// Run this in browser console or create a simple test page

async function testCategoriesAPI() {
    console.log('=== TESTING CATEGORIES API ===');
    
    try {
        const response = await fetch('/api/categories');
        console.log('Response status:', response.status);
        
        if (response.ok) {
            const categories = await response.json();
            console.log('Categories from API:');
            console.log('Total categories:', categories.length);
            categories.forEach((category, index) => {
                console.log(`${index + 1}. ${category.name || category}`);
            });
            
            // Extract just the names
            const categoryNames = categories.map(cat => cat.name || cat);
            console.log('\nCategory names array:', categoryNames);
            
            return categoryNames;
        } else {
            console.error('Failed to fetch categories:', response.status);
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

// Auto-run the test
testCategoriesAPI();