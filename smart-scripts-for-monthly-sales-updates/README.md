# Smart Scripts for Monthly Sales Updates

This folder contains automated scripts for generating monthly sales data without manual intervention.

## Main Script: `generate-monthly-sales.js`

### What it does:
- 🎯 Asks for FOUR inputs: individual sales targets for each category
- 📅 Automatically detects current month/year
- 🏗️ Generates realistic transactions across all categories:
  - **Alcohol**: Beer, wine, spirits
  - **Grocery**: Milk, bread, eggs, etc.
  - **Tobacco**: Cigarette packs
  - **Lottery**: Scratch tickets, lottery tickets

### Features:
- ✅ **Proper Payment Structure**: Matches July transaction format exactly
- ✅ **70/30 Distribution**: 70% cash, 30% card across ALL categories
- ✅ **Card Limit**: Card sales capped at $15,000 (excess goes to cash)
- ✅ **Tax Calculations**: Automatic tax computation per category
- ✅ **Transaction Sequencing**: Continues from last transaction ID
- ✅ **All Required Fields**: cashier, store, cashback, paymentBreakdown
- ✅ **Smart Detection**: Checks existing sales before generating new ones
- ✅ **Safety Limits**: Prevents over-generation

### How to Use:

```bash
cd "/Users/harmeetsingh/Documents/harmeet24singhGIT/gptPOS/smart-scripts-for-monthly-sales-updates"
node generate-monthly-sales.js
```

**Enter 4 sales targets** when prompted:
1. Alcohol sales target
2. Grocery sales target  
3. Tobacco sales target
4. Lottery sales target

### Example Output:
```
🚀 SMART MONTHLY SALES GENERATOR
==================================================

💰 Enter sales targets for each category:
🍺 Alcohol sales target: $8000
🛒 Grocery sales target: $15000
🚬 Tobacco sales target: $5000
🎲 Lottery sales target: $2000

📅 Generating sales for February 2026
🎯 Targets:
   🍺 Alcohol: $8,000
   🛒 Grocery: $15,000
   🚬 Tobacco: $5,000
   🎲 Lottery: $2,000
   📊 Total: $30,000

🏗️  Generating transactions...
   ✅ Alcohol: 156 transactions, $8,000.00
   💰 Cash: $5,600.00 (70.0%) | Card: $2,400.00 (30.0%)
   
💾 Inserting 546 transactions...

🎉 SUCCESS!
📊 Generated Sales Summary:
   💰 Total Cash: $21,000.00 (70.0%)
   💳 Total Card: $9,000.00 (30.0%)
   📝 Total Transactions: 546
   🎯 Card Limit: ✅ Respected ($15,000 max)
```

### Benefits:
- ⏰ **Time Saver**: No more explaining details every month
- 🎯 **Accurate**: Realistic transaction patterns and pricing
- 🔒 **Consistent**: Same structure as existing working transactions
- 🚀 **Smart**: Auto-detects month and existing sales
- 📊 **Complete**: Handles all categories and payment methods

Just run this script monthly with your target amount - everything else is automated! 🎉