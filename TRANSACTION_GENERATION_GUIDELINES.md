# Transaction Generation Guidelines

This document contains all the established patterns, limits, and procedures for generating and fixing transaction data in the gptPOS system.

## Database Connection

### Environment Variables
```javascript
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";
```

### MongoDB Atlas Production
- **URI**: `mongodb+srv://...@cluster0.a2m0kky.mongodb.net/convenience_store`
- **Database**: `convenience_store`
- **Collection**: `transactions`

## Card Transaction Limits (CRITICAL)

### Monthly Card Limits
- **August**: Maximum $15,000 (achieved: $14,838.55)
- **September**: Maximum $12,000 (achieved: $11,797.84)
- **October**: Maximum $15,000 (achieved: $8,523)
- **November**: Maximum $15,000 (achieved: $10,350)

### Card Limit Enforcement
- Always check card total before adding card transactions
- Use condition: `if (cardAmountGenerated + subtotal <= cardLimit)`
- Convert excess card transactions to cash using conversion scripts

## Target Sales Amounts by Month

### August 2025 Targets
- **Alcohol**: ~$8,000 (achieved: $7,720)
- **Grocery**: ~$4,200 (achieved: $4,134)  
- **Tobacco**: ~$5,900 (achieved: $11,828)
- **Lottery**: ~$25,000 (achieved: varies)

### September 2025 Targets
- **Alcohol**: ~$8,000 (achieved: $7,720)
- **Grocery**: ~$4,200 (achieved: $4,134)
- **Tobacco**: ~$5,600 (achieved: $5,598)
- **Lottery**: ~$25,800 (achieved: $25,303)

### October 2025 Targets
- **Lottery**: ~$26,987 (achieved: $26,449)

### November 2025 Targets
- **Lottery**: ~$31,000 (achieved: $30,409)

## Transaction Structure Requirements

### Required Fields
```javascript
{
  transactionId: currentTransactionId++,
  legacy_id: null,
  timestamp: timestamp,
  subtotal: subtotal,
  taxableAmount: taxableAmount,
  nonTaxableAmount: nonTaxableAmount,
  tax: tax,
  total: total,
  cashback: 0,
  paymentBreakdown: [{ method: "cash|card", amount: amount }],
  change: 0,
  transactionType: "cash|card",
  cashAmount: cashAmount,
  cardAmount: cardAmount,
  creditAmount: 0,
  items: items[]
}
```

### Payment Structure (CRITICAL)
- **MUST include `paymentBreakdown` array** for frontend to recognize paid transactions
- **Format**: `[{ method: "cash|card", amount: amount }]`
- **Consistency**: `transactionType`, `cashAmount`, `cardAmount` must match paymentBreakdown

### Item Structure
```javascript
{
  product_id: `category-${Date.now()}-${index}`,
  name: "Item Name",
  quantity: quantity,
  price: price,
  applyTax: true|false,
  category: "Category Name"
}
```

## Lottery Category Standards

### Category Names (Case Sensitive)
- **"Lotto"**: Draw games (Powerball, Mega Millions, Pick 3, etc.)
- **"Lotto instant"**: Scratch tickets (note: lowercase 'i' in 'instant')

### Frontend Detection
- Frontend `isLotteryItem()` function checks for both "Lotto" and "Lotto Instant" (capital I)
- Scripts should use "Lotto instant" (lowercase) to match August pattern

### Lottery Items List
```javascript
// Instant tickets (Lotto instant category)
{ name: "Scratch Ticket $1", category: "Lotto instant", price: 1 },
{ name: "Scratch Ticket $2", category: "Lotto instant", price: 2 },
// ... (see generate-*-lottery-clean.js files for complete list)

// Draw games (Lotto category)  
{ name: "Powerball", category: "Lotto", price: 2 },
{ name: "Mega Millions", category: "Lotto", price: 2 },
// ... (see generate-*-lottery-clean.js files for complete list)
```

### Category Distribution
- **Lotto instant**: ~65-70% of items
- **Lotto**: ~30-35% of items

## Transaction ID Ranges

### Monthly Ranges (to avoid conflicts)
- **August**: 50001-80000
- **September**: 80001-98000  
- **October**: 98001-111000
- **November**: 111001-130000
- **December**: 130001+ (available)

### Usage Pattern
```javascript
let currentTransactionId = STARTING_ID_FOR_MONTH;
// Auto-increment for each transaction
```

## Deletion Patterns (CRITICAL)

### Safe Deletion Queries
```javascript
// CORRECT: Target specific categories
await transactionCollection.deleteMany({
  timestamp: { $gte: startDate, $lt: endDate },
  items: {
    $elemMatch: {
      category: { $in: ["Lotto", "Lotto instant"] }
    }
  }
});

// WRONG: Broad date-based deletion (deletes all categories)
await transactionCollection.deleteMany({
  timestamp: { $gte: startDate, $lt: endDate }
});
```

### Pre-deletion Checks
- Always check existing data before deletion
- Log what will be deleted: `Found X existing transactions. Deleting first...`
- Verify deletion count matches expectation

## Payment Method Distribution

### Standard Distribution
- **Cash**: 65-70%
- **Card**: 30-35% (within card limits)

### Implementation
```javascript
const paymentMethods = [
  { method: "cash", percentage: 65 },
  { method: "card", percentage: 35 }
];
```

## Tax Handling

### Tax Rules
- **Alcohol**: Taxable (tax rate varies)
- **Tobacco**: Taxable (tax rate varies)
- **Grocery**: Mix of taxable/non-taxable
- **Lottery**: Non-taxable (applyTax: false)

## Script Naming Convention

### Generation Scripts
- `generate-[month]-[category]-sales.js` (e.g., `generate-september-alcohol-sales.js`)
- `generate-[month]-lottery-clean.js` (e.g., `generate-october-lottery-clean.js`)

### Fix Scripts  
- `fix-[month]-[issue]-[target].js` (e.g., `fix-august-card-limit.js`)
- `fix-[month]-[category]-sales.js` (e.g., `fix-september-tobacco-sales.js`)

## Standard Script Structure

### 1. Imports and Connection
```javascript
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";
```

### 2. Connection and Setup
```javascript
const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);
const transactionCollection = db.collection("transactions");
```

### 3. Check Existing Data
```javascript
const existing = await transactionCollection.find({
  timestamp: { $gte: startDate, $lt: endDate },
  items: { $elemMatch: { category: targetCategory } }
}).toArray();
```

### 4. Delete Existing (if needed)
```javascript
if (existing.length > 0) {
  const deleteResult = await transactionCollection.deleteMany({
    // Safe deletion query here
  });
}
```

### 5. Generation Loop
```javascript
for (let day = 1; day <= daysInMonth; day++) {
  // Day-specific logic
  for (let i = 0; i < dailyTransactionCount; i++) {
    // Transaction generation logic
  }
}
```

### 6. Verification and Summary
```javascript
const verifyTotal = await transactionCollection.aggregate([
  // Verification aggregation
]).toArray();

console.log(`✅ Generated: $${total}, Target: $${target}, Accuracy: ${accuracy}%`);
```

## Error Prevention Checklist

### Before Running Scripts
- [ ] Check existing data structure
- [ ] Verify card limits for the month
- [ ] Confirm target amounts
- [ ] Test deletion queries on small dataset first

### During Generation
- [ ] Monitor card amount accumulation
- [ ] Check transaction ID conflicts
- [ ] Verify category spelling and case
- [ ] Ensure paymentBreakdown is included

### After Generation
- [ ] Verify total amounts match targets
- [ ] Check card limits are respected
- [ ] Test frontend display of categories
- [ ] Confirm payment structure works

## Common Issues and Solutions

### Issue: Transactions show as "unpaid" in frontend
**Solution**: Add `paymentBreakdown` array to transaction structure

### Issue: Lottery categories not detected in frontend  
**Solution**: Check category spelling ("Lotto instant" vs "Lotto Instant")

### Issue: Card limits exceeded
**Solution**: Run card limit conversion scripts to convert excess to cash

### Issue: All transactions deleted instead of specific category
**Solution**: Use targeted deletion with `$elemMatch` on items.category

### Issue: Target amounts not reached
**Solution**: Adjust item pricing distribution, favor higher-value items

## Frontend Integration Notes

### Category Detection Function (app/transactions/page.js)
```javascript
const isLotteryItem = (item) => {
  return item.category === "Lotto" || 
         item.category === "Lotto instant" || 
         item.category === "Lotto Instant";
};
```

### Payment Status Recognition
- Frontend checks `paymentBreakdown` array to determine if transaction is paid
- Missing paymentBreakdown = shows as "unpaid"

## Backup and Recovery

### Before Major Changes
1. Export current data: `mongodump --uri="$MONGO_URI" --db=convenience_store`
2. Note current transaction counts by category
3. Record current totals for verification

### Recovery Process
1. Use category-specific generation scripts to restore data
2. Follow established patterns for payment structure
3. Verify frontend display after restoration

## Monthly Generation Workflow

### Standard Process
1. **Plan**: Determine target amounts and card limits
2. **Clean**: Remove existing data for specific categories only
3. **Generate**: Run generation scripts following established patterns  
4. **Verify**: Check totals, card limits, and frontend display
5. **Fix**: Run correction scripts if needed
6. **Document**: Update this guidelines file with new patterns

### Quality Assurance
- Target accuracy: 95%+ of planned amount
- Card limit compliance: Must not exceed monthly limits
- Frontend compatibility: All transactions must display correctly
- Payment structure: All transactions must show as "paid" when appropriate

---

**Last Updated**: December 20, 2025
**Current Status**: August-November 2025 data generated and verified
**Next Available Range**: December 2025+ (transaction IDs 130001+)