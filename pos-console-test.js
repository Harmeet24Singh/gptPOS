// Console test script for POS barcode2 search
// Paste this into browser console on POS page (http://localhost:3000/pos)

console.log('=== STARTING POS BARCODE2 TEST ===');

// Step 1: Check if refresh button exists
const refreshButton = document.querySelector('button[title*="Force refresh inventory"]');
console.log('1. Refresh button found:', !!refreshButton);
if (refreshButton) {
    console.log('   Button text:', refreshButton.textContent);
}

// Step 2: Check search input
const searchInput = document.querySelector('input[placeholder*="Search products"]');
console.log('2. Search input found:', !!searchInput);

// Step 3: Function to test refresh and search
function testRefreshAndSearch() {
    console.log('\n=== STARTING REFRESH TEST ===');
    
    if (refreshButton) {
        console.log('3. Clicking refresh button...');
        refreshButton.click();
        
        setTimeout(() => {
            console.log('4. Testing barcode2 search...');
            if (searchInput) {
                searchInput.value = '04257207521';
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                
                setTimeout(() => {
                    console.log('5. Search completed, checking results...');
                    
                    // Check if product list shows results
                    const productItems = document.querySelectorAll('[data-testid="product-item"], .product-item, .inventory-item');
                    console.log('   Found product items:', productItems.length);
                    
                    // Check for "Dab - Maibock" specifically
                    const dabMaibockItems = Array.from(document.querySelectorAll('*')).filter(el => 
                        el.textContent && el.textContent.includes('Dab - Maibock')
                    );
                    console.log('   "Dab - Maibock" mentions found:', dabMaibockItems.length);
                    
                    if (dabMaibockItems.length > 0) {
                        console.log('✅ SUCCESS: Dab - Maibock found after refresh and barcode2 search!');
                        dabMaibockItems.forEach((item, index) => {
                            console.log(`   Item ${index + 1}:`, item.textContent.trim());
                        });
                    } else {
                        console.log('❌ FAILED: Dab - Maibock not found in search results');
                        console.log('   Try checking browser network tab for API calls');
                        console.log('   Also check Redux DevTools for inventory state');
                    }
                }, 2000);
            }
        }, 2000);
    } else {
        console.log('❌ Cannot test - refresh button not found');
    }
}

// Step 4: Run the test
console.log('\n=== READY TO TEST ===');
console.log('Run testRefreshAndSearch() to start the test');

// Auto-run after 2 seconds to give time to read
setTimeout(() => {
    console.log('\n=== AUTO-STARTING TEST ===');
    testRefreshAndSearch();
}, 2000);