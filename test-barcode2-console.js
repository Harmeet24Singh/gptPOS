// Test script to run in browser console
async function testBarcode2Search() {
    console.log('=== TESTING BARCODE2 SEARCH ===');
    
    // Step 1: Add a test product
    const testProduct = {
        id: Date.now(),
        name: "Console Test Product",
        category: "Test",
        price: 5.99,
        stock: 15,
        lowStockThreshold: 5,
        taxable: true,
        barcode: "9999999999",
        barcode2: "04257207521",
        productId: "9999999999"
    };
    
    console.log('Adding test product:', testProduct);
    
    try {
        const addResponse = await fetch('/api/inventory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'dev-secret'
            },
            body: JSON.stringify([testProduct])
        });
        
        if (addResponse.ok) {
            console.log('✅ Product added successfully');
            
            // Step 2: Verify it was saved
            const getResponse = await fetch('/api/inventory', {
                headers: { 'x-api-key': 'dev-secret' }
            });
            const inventory = await getResponse.json();
            
            console.log('Total inventory items:', inventory.length);
            
            // Find our test product
            const ourProduct = inventory.find(item => item.name === 'Console Test Product');
            if (ourProduct) {
                console.log('✅ Found our test product:', ourProduct);
                console.log('Barcode2 field:', ourProduct.barcode2);
            } else {
                console.log('❌ Test product not found in inventory');
            }
            
            // Step 3: Test barcode2 search manually
            const barcode2Results = inventory.filter(item => 
                item.barcode2 && item.barcode2.includes('04257207521')
            );
            console.log('Manual barcode2 search results:', barcode2Results);
            
            // Step 4: Test the actual search function
            console.log('Now search for "04257207521" in the POS search box...');
            
        } else {
            console.log('❌ Failed to add product:', addResponse.status);
        }
        
    } catch (error) {
        console.error('Test error:', error);
    }
}

// Run the test
testBarcode2Search();