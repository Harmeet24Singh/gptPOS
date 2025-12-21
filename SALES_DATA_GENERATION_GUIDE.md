# Sales Data Generation Guide

This document provides step-by-step instructions for adding sales data for any month in the gptPOS system. Follow these procedures to ensure consistent data structure and payment method distribution.

## Completed Months

✅ **July 2025 Alcohol Sales**: $13,528.43 across 381 transactions  
✅ **July 2025 Tobacco Sales**: $11,888.68 across 354 transactions  
✅ **August 2025 Alcohol Sales**: $11,550.02 across 325 transactions  
✅ **September 2025 Alcohol Sales**: $7,622.46 across 210 transactions  
✅ **November 2025 Alcohol Sales**: $5,964.32 across 164 transactions

**Grocery Sales (All Fixed with Payment Breakdown Arrays):**  
✅ **July 2025**: ~$7,382 (99.4% accuracy)  
✅ **August 2025**: $6,338.71 (164 transactions)  
✅ **September 2025**: $4,366.50 (125 transactions)  
✅ **November 2025**: $3,100.18 (120 transactions)

All months include realistic business patterns, proper payment breakdowns, and comprehensive verification.

**Combined Total**: $62,758.30 across 1,843 transactions

## Overview

The system supports monthly sales data with proper payment method breakdowns and category-based filtering. Each transaction requires specific fields and structures to work correctly with the frontend transaction page.

## ⚠️ CRITICAL: Payment Breakdown Array Requirement

**ALL transactions MUST include a `paymentBreakdown` array** or they will incorrectly appear as "unpaid" on the transactions page.

Example:
```javascript
paymentBreakdown: [
  { method: "cash", amount: 45.50 },
  { method: "card", amount: 12.25 }
]
// OR for single payment method:
paymentBreakdown: [
  { method: "cash", amount: 57.75 }
]
```

**Common Issue**: Transactions generated without this array will show up in the "Unpaid Amounts" filter even though they have valid `paymentMethod` and `total` fields.

**Resolution**: Always include the breakdown array matching the transaction's payment method and total.

## Category-Specific Generation Guidelines

### Tobacco Sales Implementation

**Key Characteristics:**
- **Non-taxable**: All tobacco items should remain tax-free as configured
- **Stock Independence**: Generate sales regardless of inventory stock levels
- **Multi-item Purchases**: Realistic buying patterns with 1-4 items per transaction
- **Quantity Logic**: 
  - Small items (cigars, individual): 1-5 units
  - Regular packs: 1-3 units
  - Cartons/bulk: 1-2 units
- **Price Range Utilization**: Include all price points from individual cigars ($2.25) to cartons ($140+)

**Example Tobacco Transaction:**
```javascript
{
  transactionId: 71125,
  items: [
    { name: "Marlboro Original LKS", category: "Tobacco", price: 18.75, quantity: 2, total: 37.50, taxable: false },
    { name: "Century Sam 1", category: "Tobacco", price: 2.99, quantity: 3, total: 8.97, taxable: false }
  ],
  subtotal: 46.47,
  tax: 0,
  total: 46.47,
  taxableAmount: 0,
  nonTaxableAmount: 46.47,
  includeTax: false,
  paymentMethod: "cash",
  paymentBreakdown: [{ method: "cash", amount: 46.47 }]
}
```

**July 2025 Tobacco Results:**
- Target: $11,900 → Generated: $11,888.68 (99.9% accuracy)
- 354 transactions with 627 total items
- Payment distribution: 63.4% cash, 36.6% card
- Average items per transaction: 1.8

### Alcohol Sales Implementation

**Key Characteristics:**
- **Taxable**: Most alcohol items subject to 13% HST
- **Age Verification**: Business hours implementation (7 AM - 9 PM)
- **Mixed Transactions**: Can include multiple alcohol types
- **Price Premiums**: Higher average transaction values

### Grocery Sales Implementation

**Key Characteristics:**  
- **Mixed Taxability**: Some grocery items taxable, others not
- **Category-Specific Filtering**: Frontend has dedicated grocery-only card
- **Proportional Tax Calculation**: Uses transaction.total for accuracy
- **Volume Sales**: High transaction frequency, moderate values

## Required Transaction Structure

Each transaction must have the following fields:

```javascript
{
  transactionId: "unique_id",           // Unique transaction identifier
  timestamp: Date,                      // Transaction date/time
  total: Number,                        // Total transaction amount
  subtotal: Number,                     // Subtotal before tax
  tax: Number,                          // Tax amount (13% HST)
  taxableAmount: Number,                // Amount subject to tax
  nonTaxableAmount: Number,             // Amount not subject to tax
  includeTax: Boolean,                  // Whether tax is included
  
  // Payment Structure (REQUIRED)
  paymentMethod: String,                // "cash", "card", or "mixed"
  paymentBreakdown: Array,              // [{method: "cash", amount: 55}, {method: "card", amount: 5.07}]
  cashAmount: Number,                   // Total cash amount
  cardAmount: Number,                   // Total card amount
  cashback: Number,                     // Cashback amount (default: 0)
  
  // CRITICAL: paymentBreakdown array is MANDATORY!
  // Transactions without this array will appear as "unpaid" in frontend
  
  // Items Array
  items: [{
    name: String,                       // Item name
    category: String,                   // "Alcohol", "Tobacco", "Grocery", "Lotto", etc.
    price: Number,                      // Unit price
    quantity: Number,                   // Quantity purchased
    total: Number,                      // Item total (price * quantity)
    taxable: Boolean                    // Whether item is taxable
  }],
  
  cashier: "system"                     // Default cashier
}
```

## Step-by-Step Process

### 1. Determine Sales Target and Distribution

Before creating transactions, define:
- **Total sales amount** for the month
- **Number of transactions** to generate
- **Category distribution** (e.g., 100% alcohol, or mixed categories)
- **Payment method distribution** (recommended: 70% cash, 28% card, 2% mixed)

### 2. Create Base Script Template

Use this template for creating sales data scripts:

```javascript
const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function generate[Month][Category]Sales() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Configuration
    const TARGET_AMOUNT = 15000; // Target sales amount
    const NUM_TRANSACTIONS = 400; // Number of transactions
    const MONTH_START = new Date("2025-MM-01T00:00:00.000Z");
    const MONTH_END = new Date("2025-MM+1-01T00:00:00.000Z");

    // Payment distribution
    const cashCount = Math.floor(NUM_TRANSACTIONS * 0.70); // 70%
    const cardCount = Math.floor(NUM_TRANSACTIONS * 0.28); // 28%
    const mixedCount = NUM_TRANSACTIONS - cashCount - cardCount; // 2%

    // Generate transactions...
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}
```

### 3. Payment Method Implementation

#### Cash Transactions (70%)
```javascript
paymentMethod = "cash";
cashAmount = transaction.total;
cardAmount = 0;
paymentBreakdown = [
  { method: "cash", amount: transaction.total }
];
```

#### Card Transactions (28%)
```javascript
paymentMethod = "card";
cashAmount = 0;
cardAmount = transaction.total;
paymentBreakdown = [
  { method: "card", amount: transaction.total }
];
```

#### Mixed Transactions (2%)
```javascript
const cashPercentage = 0.6 + (Math.random() * 0.3); // 60-90% cash
const cashPortion = Math.round(transaction.total * cashPercentage * 100) / 100;
const cardPortion = Math.round((transaction.total - cashPortion) * 100) / 100;

paymentMethod = "mixed";
cashAmount = cashPortion;
cardAmount = cardPortion;
paymentBreakdown = [
  { method: "cash", amount: cashPortion },
  { method: "card", amount: cardPortion }
];
```

### 4. Category-Specific Requirements

#### Alcohol Sales
- **Category**: "Alcohol"
- **Common Items**: "Budweiser 6-pack", "Corona 12-pack", "Wine Bottle", etc.
- **Tax**: Taxable items (13% HST)
- **Price Range**: $15-80 per transaction

#### Grocery Sales  
- **Category**: "Grocery" or null (default)
- **Items**: Various food items, snacks, beverages
- **Tax**: Mix of taxable and non-taxable items
- **Price Range**: $5-50 per transaction

#### Tobacco Sales
- **Category**: "Tobacco" 
- **Items**: Cigarettes, cigars, tobacco products
- **Tax**: Taxable items
- **Price Range**: $12-25 per transaction

### 5. Transaction ID Generation

Use sequential IDs for each month:
```javascript
// July: 70001, 70002, 70003...
// August: 80001, 80002, 80003...
// September: 90001, 90002, 90003...
// October: 100001, 100002, 100003...

const transactionId = (monthPrefix * 1000) + (index + 1);
```

### 6. Shuffle Transaction Order

**IMPORTANT**: Always shuffle transactions to create realistic business patterns.

Sequential assignment is unrealistic. Consider both payment methods AND weekly business patterns.

#### 6.1 Weekly Business Patterns

Real convenience stores have predictable weekly patterns. Distribute transactions across days realistically:

```javascript
// Weekly business patterns (percentage of weekly volume per day)
const dayPatterns = {
  1: 0.10, // Monday - slow (10%)
  2: 0.16, // Tuesday - good (16%) 
  3: 0.16, // Wednesday - good (16%)
  4: 0.12, // Thursday - slow (12%)
  5: 0.18, // Friday - good (18%)
  6: 0.20, // Saturday - best (20%)
  0: 0.08  // Sunday - slowest (8%)
};

// Distribute transactions across month days based on day-of-week patterns
for (each day in month) {
  const dayOfWeek = date.getDay();
  const expectedTransactions = totalTransactions * dayPatterns[dayOfWeek] / daysInMonth;
  
  // Assign transactions to this day with realistic hourly distribution
  // Business hours: 6 AM to 11 PM
  // Peak hours: 7-9 AM (morning rush), 12-2 PM (lunch), 5-8 PM (evening rush)
  
  for (each transaction in day) {
    let hourMultiplier;
    const randomHour = 6 + Math.random() * 17; // 6 AM to 11 PM
    
    // Peak hours get 70-100% probability, off-peak gets 30-70%
    if ((randomHour >= 7 && randomHour <= 9) || 
        (randomHour >= 12 && randomHour <= 14) || 
        (randomHour >= 17 && randomHour <= 20)) {
      hourMultiplier = 0.7 + Math.random() * 0.3; // Peak hours
    } else {
      hourMultiplier = 0.3 + Math.random() * 0.4; // Off-peak hours
    }
    
    // Set transaction timestamp with realistic hour/minute/second
    const finalHour = Math.floor(6 + hourMultiplier * 17);
    const minutes = Math.floor(Math.random() * 60);
    const seconds = Math.floor(Math.random() * 60);
  }
}
```

#### 6.2 Payment Method Shuffling

After distributing by day patterns, shuffle payment methods within each day:

```javascript
// After generating all transactions, shuffle payment methods
const paymentMethods = transactions.map(t => ({
  paymentMethod: t.paymentMethod,
  paymentBreakdown: t.paymentBreakdown,
  cashAmount: t.cashAmount,
  cardAmount: t.cardAmount,
  cashback: t.cashback || 0
}));

// Fisher-Yates shuffle algorithm
for (let i = paymentMethods.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [paymentMethods[i], paymentMethods[j]] = [paymentMethods[j], paymentMethods[i]];
}

// Apply shuffled payment methods back to transactions
for (let i = 0; i < transactions.length; i++) {
  // Update transaction with shuffled payment data
}
```

**CRITICAL**: After shuffling, you MUST fix payment amounts to match transaction totals to prevent artificial unpaid amounts.

### 6.3 Fix Payment Amount Mismatches

When shuffling payment methods, amounts from different transactions get mismatched, creating artificial "unpaid" amounts. Always run this fix:

```javascript
// Fix payment amounts to match transaction totals
for (const transaction of transactions) {
  const currentPaymentTotal = transaction.paymentBreakdown.reduce((sum, p) => sum + p.amount, 0);
  const difference = transaction.total - currentPaymentTotal;

  if (Math.abs(difference) > 0.01) { // If difference > 1 cent
    if (transaction.paymentMethod === "cash") {
      transaction.paymentBreakdown = [{ method: "cash", amount: transaction.total }];
      transaction.cashAmount = transaction.total;
      transaction.cardAmount = 0;
      
    } else if (transaction.paymentMethod === "card") {
      transaction.paymentBreakdown = [{ method: "card", amount: transaction.total }];
      transaction.cashAmount = 0;
      transaction.cardAmount = transaction.total;
      
    } else if (transaction.paymentMethod === "mixed") {
      // Maintain cash/card ratio but scale to match total
      const cashPayment = transaction.paymentBreakdown.find(p => p.method === "cash");
      const cardPayment = transaction.paymentBreakdown.find(p => p.method === "card");
      
      const totalCurrentPayments = cashPayment.amount + cardPayment.amount;
      const cashRatio = cashPayment.amount / totalCurrentPayments;
      
      const newCashAmount = Math.round(transaction.total * cashRatio * 100) / 100;
      const newCardAmount = Math.round((transaction.total - newCashAmount) * 100) / 100;
      
      transaction.paymentBreakdown = [
        { method: "cash", amount: newCashAmount },
        { method: "card", amount: newCardAmount }
      ];
      transaction.cashAmount = newCashAmount;
      transaction.cardAmount = newCardAmount;
    }
  }
}
```

### 7. Validation Steps

After generating and shuffling data, always run validation:

1. **Check total amount**: Verify generated amount matches target
2. **Payment distribution**: Confirm 70/28/2 split overall
3. **Weekly patterns**: Verify Saturday is busiest, Sunday is slowest, Tuesday/Wednesday are strong
4. **Daily distribution**: Check transactions are spread across business hours (6 AM - 11 PM)
5. **Peak hours**: Verify higher transaction density during 7-9 AM, 12-2 PM, 5-8 PM
6. **Transaction order**: Verify payment methods are mixed throughout each day
7. **Payment amount accuracy**: Ensure paymentBreakdown totals = transaction totals (no artificial unpaid amounts)
8. **Category verification**: Ensure proper categorization
9. **Frontend testing**: Test transaction page filtering
10. **Payment breakdown**: Verify cash/card calculations work
11. **Unpaid amount check**: Should be $0.00 for properly paid transactions

### 7. Frontend Compatibility

Ensure the generated data works with these frontend functions:
- `getAlcoholCategoryBreakdown()`
- `getAlcoholPaymentBreakdown()`
- `getTobaccoSalesBreakdown()`
- `getGrocerySalesBreakdown()`
- `getPaymentMethodBreakdown()`

### 8. Example Scripts to Reference

Current project contains these reference scripts:
- `generate-alcohol-sales-july.js` - Pure alcohol sales generation
- `generate-alcohol-sales-october.js` - Alcohol with payment breakdown
- `update-july-payments.js` - Payment structure conversion
- `update-credit-to-card.js` - Payment method standardization
- `shuffle-transaction-order.js` - Payment method shuffling only
- `shuffle-by-day-patterns.js` - Realistic weekly business pattern distribution
- `fix-payment-amounts.js` - Fix payment/transaction total mismatches

## Important Notes

1. **Always use "card" instead of "credit" or "debit"** for payment methods
2. **Include paymentBreakdown array** for all transactions
3. **Maintain 70% cash, 28% card, 2% mixed distribution**
4. **Use proper category names** for filtering to work correctly
5. **Test frontend filtering** after data generation
6. **Backup database** before running generation scripts

## Troubleshooting

### Frontend Not Showing Payment Breakdown
- Check if `paymentBreakdown` array exists
- Verify payment methods are "cash" or "card" (not "credit"/"debit")
- Ensure `cashAmount` and `cardAmount` fields are present

### Artificial Unpaid Amounts Appearing
**Problem**: Frontend shows unpaid amounts when all transactions should be paid
**Cause**: Payment breakdown amounts don't match transaction totals (usually after shuffling)
**Solution**: Run payment amount fixing script to recalculate amounts

```javascript
// Check for mismatched amounts
const difference = transaction.total - paymentBreakdown.reduce((sum, p) => sum + p.amount, 0);
if (Math.abs(difference) > 0.01) {
  // Fix payment amounts as shown in section 6.1
}
```

### Category Filtering Issues
- Verify `category` field spelling and capitalization
- Check for conflicting keywords in item names
- Review category detection logic in frontend

### Unrealistic Business Patterns
**Problem**: All days have similar transaction counts or transactions clustered at specific times
**Cause**: Missing weekly/daily distribution logic
**Solution**: Apply realistic business patterns

```javascript
// Verify weekly distribution shows realistic patterns
const dayStats = transactions.groupBy(t => t.timestamp.getDay());
// Saturday should be highest, Sunday should be lowest
// Tuesday/Wednesday should be strong, Monday/Thursday slower

// Verify hourly distribution shows peak hours
const hourStats = transactions.groupBy(t => t.timestamp.getHours());
// Should see peaks at 7-9 AM, 12-2 PM, 5-8 PM
```

### Incorrect Totals
- Verify tax calculations (13% HST)
- Check rounding for currency amounts
- Ensure `total` matches sum of payment breakdown
- After shuffling, always verify payment amounts = transaction totals

## Successfully Completed Examples

### August 2025 Alcohol Sales ($11,550)
Scripts created and executed:
- `generate-alcohol-sales-august.js` - Initial data creation
- `enhance-august-alcohol-sales.js` - Applied realistic patterns and payment fixes
- `verify-august-alcohol-sales.js` - Comprehensive verification

Results:
- **Total Sales**: $11,550.02 (100.00% of target)
- **Transactions**: 325 alcohol transactions
- **Payment Distribution**: 69.8% cash, 28.0% card, 2.2% mixed
- **Weekly Patterns**: Saturday highest (74 transactions), Sunday lowest (26 transactions)
- **Unpaid Amounts**: $0.00 (perfect payment matching)

### September 2025 Alcohol Sales ($7,622)
Scripts created and executed:
- `generate-alcohol-sales-september.js` - Initial data creation targeting ~$8,000
- `enhance-september-alcohol-sales.js` - Applied realistic patterns and payment fixes  
- `verify-september-alcohol-sales.js` - Comprehensive verification

Results:
- **Total Sales**: $7,622.46 (95.28% of $8,000 target)
- **Transactions**: 210 alcohol transactions
- **Payment Distribution**: 69.0% cash, 28.6% card, 2.4% mixed
- **Weekly Patterns**: Saturday highest (37 transactions), Sunday lowest (20 transactions)
- **Unpaid Amounts**: $0.00 (perfect payment matching)

### November 2025 Alcohol Sales ($5,964)
Scripts created and executed:
- `generate-alcohol-sales-november.js` - Initial data creation targeting ~$6,000
- `enhance-november-alcohol-sales.js` - Applied realistic patterns and payment fixes  
- `verify-november-alcohol-sales.js` - Comprehensive verification

Results:
- **Total Sales**: $5,964.32 (99.41% of $6,000 target)
- **Transactions**: 164 alcohol transactions
- **Payment Distribution**: 69.5% cash, 28.0% card, 2.4% mixed
- **Weekly Patterns**: Saturday highest (35 transactions), Sunday lowest (17 transactions)
- **Unpaid Amounts**: $0.00 (perfect payment matching)

## Best Practices for Data Generation

### 1. Realistic Purchase Patterns
- **Tobacco**: Focus on 1-2 item transactions, occasional bulk purchases
- **Alcohol**: Mix single bottles with multi-item purchases  
- **Grocery**: Higher item counts (2-8 items typical)

### 2. Price Distribution Strategy
- Include full price spectrum from each category
- Weight toward mid-range prices for realism
- Include occasional high-value transactions (cartons, premium items)

### 3. Payment Method Considerations
- **Cash preference**: 60-65% for most categories
- **Card growth**: 35-40% reflecting modern trends
- **Mixed payments**: Very rare (<1%) for complexity

### 4. Temporal Distribution  
- Spread transactions across all business days
- Peak hours: 12-2 PM, 5-7 PM for higher frequency
- Weekend patterns: Slightly different distribution

### 5. Quantity Logic by Category
```javascript
// Tobacco
if (price <= 5) quantity = 1-5;      // Individual cigars
else if (price > 50) quantity = 1-2;  // Cartons  
else quantity = 1-3;                  // Regular packs

// Alcohol
if (price > 30) quantity = 1-2;       // Premium bottles
else quantity = 1-4;                  // Standard items

// Grocery  
quantity = 1-3 (most common), occasional bulk 4-8
```

### 6. Tobacco-Specific Guidelines
- **Ignore Stock Levels**: Generate sales regardless of inventory  
- **Non-taxable Treatment**: Keep tax: 0 for all tobacco items
- **Multi-item Logic**: Combine different tobacco products realistically
- **Price Range Usage**: Include singles ($2-5), packs ($15-25), cartons ($50-140)

## Monthly Checklist

- [ ] Define sales target and transaction count
- [ ] Create generation script using template
- [ ] Implement proper payment distribution
- [ ] Set correct category and item data
- [ ] **For tobacco: Include all items regardless of stock levels**
- [ ] **For tobacco: Ensure non-taxable configuration (tax: 0)**
- [ ] **For tobacco: Implement realistic quantity logic based on price ranges**
- [ ] Generate sequential transaction IDs
- [ ] **Distribute transactions using realistic weekly patterns** (Mon/Thu slow, Tue/Wed/Fri/Sat busy, Sun slowest)
- [ ] **Shuffle payment methods within each day for realistic order**
- [ ] **Fix payment amounts to match transaction totals**
- [ ] **Include mandatory paymentBreakdown arrays**
- [ ] Run validation checks
- [ ] Verify unpaid amount is $0.00 (no payment mismatches)
- [ ] Verify realistic weekly distribution (Sat highest, Sun lowest)
- [ ] Test frontend functionality
- [ ] Verify payment method breakdown display
- [ ] Verify realistic transaction order (mixed payment types)
- [ ] Document any customizations made

---

**Last Updated**: December 18, 2025  
**Created for**: gptPOS Transaction Management System