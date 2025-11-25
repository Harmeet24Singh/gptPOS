const { MongoClient } = require('mongodb');
const url = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB || 'convenience_store';

let _client = null;
let _db = null;

async function connect() {
  if (_db) return _db;
  if (!_client) {
    _client = new MongoClient(url, { useUnifiedTopology: true });
    await _client.connect();
  }
  _db = _client.db(dbName);
  // Ensure indexes
  try {
    await _db.collection('inventory').createIndex({ id: 1 }, { unique: true });
    await _db.collection('users').createIndex({ id: 1 }, { unique: true, sparse: true });
    await _db.collection('users').createIndex({ username: 1 }, { unique: true });
  } catch (e) {
    // ignore index errors
  }
  return _db;
}

// Inventory helpers
async function getAllInventory() {
  const db = await connect();
  return db.collection('inventory').find({}).sort({ name: 1 }).toArray();
}

async function getInventoryById(id) {
  const db = await connect();
  const n = Number(id);
  return db.collection('inventory').findOne({ id: n });
}

async function upsertInventoryItems(items) {
  if (!Array.isArray(items)) items = [items];
  console.log('upsertInventoryItems called with:', items.length, 'items');
  
  const db = await connect();
  const ops = items.map((it, index) => {
    console.log(`Processing item ${index} for upsert:`, JSON.stringify(it, null, 2));
    
    // Validate and convert ID
    let itemId = undefined;
    if (it.id !== undefined && it.id !== null) {
      itemId = Number(it.id);
      if (isNaN(itemId)) {
        console.error(`Invalid ID for item ${index}:`, it.id);
        throw new Error(`Invalid ID: ${it.id}`);
      }
      console.log(`Item ${index} has valid numeric ID:`, itemId);
    } else {
      console.log(`Item ${index} has no ID, will be auto-generated`);
    }
    
    const obj = {
      id: itemId,
      name: it.name || '',
      category: it.category || '',
      price: Number(it.price || 0),
      stock: Number(it.stock || 0),
      lowStockThreshold: Number(it.lowStockThreshold || 0),
      taxable: !!it.taxable,
      barcode: it.barcode || (itemId ? itemId.toString() : null),  // Default to product ID as barcode
    };
    
    // Add barcode2 if provided
    if (it.barcode2) {
      obj.barcode2 = it.barcode2;
    }
    
    // Only add productId if it's provided, to avoid null constraint issues
    if (it.productId) {
      obj.productId = it.productId;
    } else if (itemId) {
      obj.productId = itemId.toString(); // Use ID as productId for new items
    }
    
    // Validate required fields
    if (!obj.name) {
      throw new Error(`Item name is required for item ${index}`);
    }
    
    // remove undefined id to let upsert use provided id or create one
    if (obj.id === undefined) delete obj.id;
    
    const filter = obj.id !== undefined ? { id: obj.id } : { name: obj.name };
    
    console.log(`=== MONGODB UPSERT OPERATION ${index} ===`);
    console.log('Filter:', JSON.stringify(filter, null, 2));
    console.log('Update document:', JSON.stringify(obj, null, 2));
    console.log(`Item ${index} filter:`, filter);
    console.log(`Item ${index} object:`, obj);
    
    return {
      updateOne: {
        filter,
        update: { $set: obj },
        upsert: true,
      },
    };
  });
  
  if (ops.length === 0) {
    console.log('No operations to perform');
    return;
  }
  
  console.log('Executing bulkWrite with', ops.length, 'operations');
  try {
    const result = await db.collection('inventory').bulkWrite(ops);
    console.log('BulkWrite result:', result);
  } catch (error) {
    console.error('BulkWrite error:', error);
    
    // If it's a duplicate key error on productId, try to handle it gracefully
    if (error.code === 11000 && error.message.includes('productId')) {
      console.log('Detected productId duplicate key error, attempting individual upserts...');
      
      // Try each item individually with unique productId generation
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        try {
          const itemWithUniqueProductId = {
            ...item,
            productId: item.productId || `${item.id || Date.now()}-${i}`
          };
          
          const filter = item.id ? { id: item.id } : { name: item.name };
          await db.collection('inventory').updateOne(
            filter,
            { $set: itemWithUniqueProductId },
            { upsert: true }
          );
          console.log(`Successfully upserted item ${i} with unique productId`);
        } catch (individualError) {
          console.error(`Failed to upsert individual item ${i}:`, individualError);
          throw individualError;
        }
      }
      console.log('All items processed successfully via individual upserts');
      return;
    }
    
    throw error;
  }
}

async function deleteInventoryById(id) {
  const db = await connect();
  const n = Number(id);
  await db.collection('inventory').deleteOne({ id: n });
}

// Users helpers
async function getUsers() {
  const db = await connect();
  const users = await db.collection('users').find({}).sort({ id: 1 }).toArray();
  
  // Auto-create default users if no users exist
  if (users.length === 0) {
    console.log('No users found. Creating default admin and cashier users...');
    
    const defaultUsers = [
      {
        id: 'admin',
        pwd: 'admin123',
        role: 'Admin',
        email: 'admin@pos.local',
        active: true,
        permissions_json: JSON.stringify({
          inventory: true,
          users: true,
          reports: true,
          pos: true,
          transactions: true,
          manageUsers: true,
          manageInventory: true,
          manageReports: true,
          managePOS: true
        })
      },
      {
        id: 'cashier',
        pwd: 'cashier1',
        role: 'Cashier',
        email: 'cashier@pos.local',
        active: true,
        permissions_json: JSON.stringify({
          inventory: false,
          users: false,
          reports: false,
          pos: true,
          transactions: false,
          manageUsers: false,
          manageInventory: false,
          manageReports: false,
          managePOS: true
        })
      }
    ];
    
    try {
      await db.collection('users').insertMany(defaultUsers);
      console.log('✅ Default users created:');
      console.log('   - Admin: username=admin, password=admin123');
      console.log('   - Cashier: username=cashier, password=cashier1');
    } catch (error) {
      console.error('Failed to create default users:', error);
    }
    
    const newUsers = await db.collection('users').find({}).sort({ id: 1 }).toArray();
    return newUsers.map(user => ({
      ...user,
      username: user.id || user.username,
      password: user.pwd || user.password || ''
    }));
  }
  
  // Map database fields to frontend expected fields
  return users.map(user => ({
    ...user,
    username: user.id, // Map id to username for frontend
    password: user.pwd || user.password // Map pwd to password for frontend
  }));
}

async function getUserByUsername(username) {
  const db = await connect();
  // Try to find user by id first, then by username field if it exists
  let user = await db.collection('users').findOne({ id: username });
  if (!user) {
    user = await db.collection('users').findOne({ username: username });
  }
  
  if (user) {
    // Map database fields to frontend expected fields
    return {
      ...user,
      username: user.id || user.username,
      password: user.pwd || user.password || ''
    };
  }
  return null;
}

async function upsertUser(body) {
  const db = await connect();
  const id = body.id || body.username;
  await db.collection('users').updateOne(
    { id },
    {
      $set: {
        id,
        email: body.email || '',
        pwd: body.password || body.pwd || '', // Store as pwd in database
        role: body.role || 'user',
        active: body.active !== false,
        permissions_json: JSON.stringify(body.permissions || {}),
      },
    },
    { upsert: true }
  );
}

async function replaceAllUsers(users) {
  const db = await connect();
  
  // Clear existing users and insert new ones
  await db.collection('users').deleteMany({});
  
  if (users.length > 0) {
    const formattedUsers = users.map(user => ({
      id: user.id || user.username,
      email: user.email || '',
      pwd: user.password || user.pwd || '', // Store as pwd in database
      role: user.role || 'user',
      active: user.active !== false,
      permissions_json: JSON.stringify(user.permissions || {}),
    }));
    
    await db.collection('users').insertMany(formattedUsers);
  }
}

async function deleteUserById(id) {
  const db = await connect();
  
  // Prevent deletion of admin users (super role protection)
  const user = await db.collection('users').findOne({ id: id });
  if (user && (user.role === 'admin' || user.role === 'Admin' || user.id === 'admin')) {
    throw new Error('Admin users cannot be deleted - this is a protected super role');
  }
  
  await db.collection('users').deleteOne({ id: id });
}

// Transactions helpers
async function saveTransaction(txObj) {
  const db = await connect();
  
  // Determine transaction type based on payment breakdown
  const paymentBreakdown = txObj.paymentBreakdown || txObj.payment || [];
  let transactionType = 'mixed'; // default
  let cashAmount = 0;
  let cardAmount = 0;
  let creditAmount = 0;
  
  // Calculate payment amounts by method
  let hasLotto = false;
  paymentBreakdown.forEach(payment => {
    const amount = Number(payment.amount || 0);
    switch (payment.method?.toLowerCase()) {
      case 'cash':
        cashAmount += amount;
        break;
      case 'card':
        cardAmount += amount;
        break;
      case 'credit':
        creditAmount += amount;
        break;
      case 'lotto':
        hasLotto = true;
        // Lotto winnings don't count as payment, they reduce total owed
        break;
    }
  });
  
  // Determine primary transaction type
  if (hasLotto && cashAmount < 0 && cardAmount === 0 && creditAmount === 0) {
    // Lotto-only transaction (cash going out)
    transactionType = 'lotto';
  } else if (creditAmount > 0) {
    if (cashAmount > 0 || cardAmount > 0) {
      transactionType = 'partial_credit';
    } else {
      transactionType = 'credit';
    }
  } else if (cashAmount > 0 && cardAmount > 0) {
    transactionType = 'mixed';
  } else if (cashAmount > 0) {
    transactionType = 'cash';
  } else if (cardAmount > 0) {
    transactionType = 'card';
  } else if (hasLotto) {
    // Lotto with other payments
    transactionType = 'lotto_mixed';
  }
  
  // normalize timestamp
  const doc = {
    legacy_id: txObj.id || null,
    timestamp: txObj.timestamp ? new Date(txObj.timestamp) : new Date(),
    subtotal: Number(txObj.subtotal || 0),
    taxableAmount: Number(txObj.taxableAmount || 0),
    nonTaxableAmount: Number(txObj.nonTaxableAmount || 0),
    tax: Number(txObj.tax || 0),
    total: Number(txObj.total || 0),
    cashback: Number(txObj.cashback || 0),
    paymentBreakdown: paymentBreakdown,
    change: Number(txObj.change || 0),
    transactionType: transactionType, // New field: 'cash', 'card', 'mixed', 'credit', 'partial_credit'
    cashAmount: cashAmount,           // New field: Total cash amount
    cardAmount: cardAmount,           // New field: Total card amount  
    creditAmount: creditAmount,       // New field: Total credit amount
    items: Array.isArray(txObj.items) ? txObj.items.map((it) => ({
      product_id: it.id || null,
      name: it.name || '',
      quantity: Number(it.quantity || 0),
      price: Number(it.price || 0),
      applyTax: !!it.applyTax,
    })) : [],
  };

  const res = await db.collection('transactions').insertOne(doc);
  const insertedId = res.insertedId;

  // Deduct stock for each item (best-effort)
  for (const it of doc.items) {
    if (!it.product_id) continue;
    const cur = await db.collection('inventory').findOne({ id: Number(it.product_id) });
    if (cur) {
      const newStock = (cur.stock || 0) - (it.quantity || 0);
      await db.collection('inventory').updateOne({ id: Number(it.product_id) }, { $set: { stock: newStock } });
    }
  }

  return insertedId;
}

async function getTransactions(limit = 100) {
  const db = await connect();
  const cursor = db.collection('transactions').find({}).sort({ _id: -1 }).limit(Number(limit));
  const rows = await cursor.toArray();
  return rows.map((r) => ({
    ...r,
    id: r._id.toString(), // Convert MongoDB ObjectId to string for frontend
    timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : r.timestamp,
  }));
}

async function deleteTransaction(id) {
  const db = await connect();
  const { ObjectId } = require('mongodb');
  
  try {
    // Convert string ID to ObjectId for MongoDB
    const objectId = new ObjectId(id);
    const result = await db.collection('transactions').deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
}

// Categories helpers
async function getCategories() {
  const db = await connect();
  const categories = await db.collection('categories').find({}).sort({ name: 1 }).toArray();
  
  // If no categories exist, create default ones
  if (categories.length === 0) {
    const defaultCategories = [
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
    ];
    
    await db.collection('categories').insertMany(defaultCategories);
    return defaultCategories;
  }
  
  return categories;
}

async function saveCategory(category) {
  const db = await connect();
  
  if (category.id) {
    // Update existing category
    const result = await db.collection('categories').updateOne(
      { id: Number(category.id) },
      { 
        $set: {
          name: category.name,
          description: category.description || '',
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    return { id: category.id, ...category };
  } else {
    // Create new category - find next available ID
    const lastCategory = await db.collection('categories').findOne({}, { sort: { id: -1 } });
    const nextId = (lastCategory?.id || 0) + 1;
    
    const newCategory = {
      id: nextId,
      name: category.name,
      description: category.description || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('categories').insertOne(newCategory);
    return newCategory;
  }
}

async function deleteCategory(id) {
  const db = await connect();
  const result = await db.collection('categories').deleteOne({ id: Number(id) });
  return result.deletedCount > 0;
}

// Credit Accounts helpers
async function getCreditAccounts() {
  const db = await connect();
  const cursor = db.collection('creditAccounts').find({}).sort({ lastTransactionDate: -1 });
  const accounts = await cursor.toArray();
  return accounts.map((account) => ({
    ...account,
    id: account._id.toString(),
    createdAt: account.createdAt instanceof Date ? account.createdAt.toISOString() : account.createdAt,
    updatedAt: account.updatedAt instanceof Date ? account.updatedAt.toISOString() : account.updatedAt,
    lastTransactionDate: account.lastTransactionDate instanceof Date ? account.lastTransactionDate.toISOString() : account.lastTransactionDate,
  }));
}

async function getCreditAccountByName(customerName) {
  const db = await connect();
  const account = await db.collection('creditAccounts').findOne({ 
    customerName: { $regex: new RegExp('^' + customerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
  });
  
  if (!account) return null;
  
  return {
    ...account,
    id: account._id.toString(),
    createdAt: account.createdAt instanceof Date ? account.createdAt.toISOString() : account.createdAt,
    updatedAt: account.updatedAt instanceof Date ? account.updatedAt.toISOString() : account.updatedAt,
    lastTransactionDate: account.lastTransactionDate instanceof Date ? account.lastTransactionDate.toISOString() : account.lastTransactionDate,
  };
}

async function upsertCreditAccount(accountData) {
  const db = await connect();
  const { ObjectId } = require('mongodb');
  
  const now = new Date();
  const customerName = accountData.customerName?.trim();
  
  if (!customerName) {
    throw new Error('Customer name is required');
  }
  
  // Find existing account (case-insensitive)
  const existingAccount = await db.collection('creditAccounts').findOne({
    customerName: { $regex: new RegExp('^' + customerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
  });
  
  if (existingAccount) {
    // Update existing account
    const updateData = {
      balance: Number(accountData.balance || existingAccount.balance || 0),
      phone: accountData.phone || existingAccount.phone || '',
      email: accountData.email || existingAccount.email || '',
      address: accountData.address || existingAccount.address || '',
      notes: accountData.notes || existingAccount.notes || '',
      isActive: accountData.isActive !== undefined ? accountData.isActive : existingAccount.isActive,
      updatedAt: now
    };
    
    // Update last transaction date if provided
    if (accountData.lastTransactionDate) {
      updateData.lastTransactionDate = accountData.lastTransactionDate instanceof Date ? 
        accountData.lastTransactionDate : new Date(accountData.lastTransactionDate);
    }
    
    // Update transaction count if provided
    if (accountData.transactionCount !== undefined) {
      updateData.transactionCount = Number(accountData.transactionCount);
    }
    
    const result = await db.collection('creditAccounts').updateOne(
      { _id: existingAccount._id },
      { $set: updateData }
    );
    
    if (result.modifiedCount > 0) {
      const updatedAccount = await db.collection('creditAccounts').findOne({ _id: existingAccount._id });
      return {
        ...updatedAccount,
        id: updatedAccount._id.toString(),
      };
    }
    
    return {
      ...existingAccount,
      id: existingAccount._id.toString(),
    };
  } else {
    // Create new account
    const newAccount = {
      customerName: customerName,
      balance: Number(accountData.balance || 0),
      phone: accountData.phone || '',
      email: accountData.email || '',
      address: accountData.address || '',
      notes: accountData.notes || '',
      isActive: accountData.isActive !== undefined ? accountData.isActive : true,
      transactionCount: Number(accountData.transactionCount || 0),
      createdAt: now,
      updatedAt: now,
      lastTransactionDate: accountData.lastTransactionDate ? 
        (accountData.lastTransactionDate instanceof Date ? accountData.lastTransactionDate : new Date(accountData.lastTransactionDate)) 
        : now
    };
    
    const result = await db.collection('creditAccounts').insertOne(newAccount);
    
    return {
      ...newAccount,
      id: result.insertedId.toString(),
    };
  }
}

async function addToCreditAccount(customerName, amount, transactionId = null) {
  const db = await connect();
  
  // Get or create account
  let account = await getCreditAccountByName(customerName);
  
  if (!account) {
    // Create new account if it doesn't exist
    account = await upsertCreditAccount({
      customerName: customerName,
      balance: amount,
      transactionCount: 1,
      lastTransactionDate: new Date()
    });
  } else {
    // Update existing account
    const newBalance = Number(account.balance || 0) + Number(amount);
    const newTransactionCount = Number(account.transactionCount || 0) + 1;
    
    account = await upsertCreditAccount({
      customerName: customerName,
      balance: newBalance,
      transactionCount: newTransactionCount,
      lastTransactionDate: new Date(),
      phone: account.phone,
      email: account.email,
      address: account.address,
      notes: account.notes,
      isActive: account.isActive
    });
  }
  
  return account;
}

async function payToCreditAccount(customerName, paymentAmount) {
  const db = await connect();
  
  const account = await getCreditAccountByName(customerName);
  if (!account) {
    throw new Error('Credit account not found');
  }
  
  const currentBalance = Number(account.balance || 0);
  const payment = Number(paymentAmount);
  
  if (payment > currentBalance) {
    throw new Error('Payment amount exceeds account balance');
  }
  
  const newBalance = currentBalance - payment;
  
  const updatedAccount = await upsertCreditAccount({
    customerName: customerName,
    balance: newBalance,
    transactionCount: account.transactionCount,
    lastTransactionDate: new Date(),
    phone: account.phone,
    email: account.email,
    address: account.address,
    notes: account.notes,
    isActive: account.isActive
  });
  
  return {
    ...updatedAccount,
    paymentAmount: payment,
    previousBalance: currentBalance,
    newBalance: newBalance
  };
}

async function deleteCreditAccount(id) {
  const db = await connect();
  const { ObjectId } = require('mongodb');
  
  try {
    const objectId = new ObjectId(id);
    const result = await db.collection('creditAccounts').deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting credit account:', error);
    return false;
  }
}

async function searchCreditAccounts(searchTerm, includeInactive = false) {
  const db = await connect();
  
  const query = {
    customerName: { $regex: searchTerm, $options: 'i' }
  };
  
  if (!includeInactive) {
    query.isActive = { $ne: false };
  }
  
  const cursor = db.collection('creditAccounts').find(query).sort({ balance: -1, lastTransactionDate: -1 });
  const accounts = await cursor.toArray();
  
  return accounts.map((account) => ({
    ...account,
    id: account._id.toString(),
    createdAt: account.createdAt instanceof Date ? account.createdAt.toISOString() : account.createdAt,
    updatedAt: account.updatedAt instanceof Date ? account.updatedAt.toISOString() : account.updatedAt,
    lastTransactionDate: account.lastTransactionDate instanceof Date ? account.lastTransactionDate.toISOString() : account.lastTransactionDate,
  }));
}

// Till Count Management Functions
async function getCurrentTill() {
  try {
    const db = await connect();
    const tillCollection = db.collection('tillCounts');
    
    // Find the most recent open till (no endTime)
    const currentTill = await tillCollection.findOne(
      { endTime: null },
      { sort: { startTime: -1 } }
    );
    
    return currentTill;
  } catch (error) {
    console.error('Error getting current till:', error);
    throw error;
  }
}

async function getTillHistory(limit = 20) {
  try {
    const db = await connect();
    const tillCollection = db.collection('tillCounts');
    
    const history = await tillCollection
      .find({})
      .sort({ startTime: -1 })
      .limit(limit)
      .toArray();
    
    return history;
  } catch (error) {
    console.error('Error getting till history:', error);
    throw error;
  }
}

async function startTill(tillData) {
  try {
    const db = await connect();
    const tillCollection = db.collection('tillCounts');
    
    // Generate a simple ID
    const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    const till = {
      id: generateId(),
      startAmount: tillData.startAmount,
      startUser: tillData.startUser,
      startTime: tillData.startTime,
      startDenominations: tillData.startDenominations || {},
      endAmount: null,
      endUser: null,
      endTime: null,
      endDenominations: null,
      createdAt: new Date().toISOString()
    };
    
    await tillCollection.insertOne(till);
    return till;
  } catch (error) {
    console.error('Error starting till:', error);
    throw error;
  }
}

async function endTill(tillId, endData) {
  try {
    const db = await connect();
    const tillCollection = db.collection('tillCounts');
    
    const updateResult = await tillCollection.updateOne(
      { id: tillId },
      {
        $set: {
          endAmount: endData.endAmount,
          endUser: endData.endUser,
          endTime: endData.endTime,
          endDenominations: endData.endDenominations || {},
          updatedAt: new Date().toISOString()
        }
      }
    );
    
    if (updateResult.matchedCount === 0) {
      throw new Error('Till not found');
    }
    
    const updatedTill = await tillCollection.findOne({ id: tillId });
    return updatedTill;
  } catch (error) {
    console.error('Error ending till:', error);
    throw error;
  }
}

module.exports = {
  connect,
  getAllInventory,
  getInventoryById,
  upsertInventoryItems,
  deleteInventoryById,
  getUsers,
  getUserByUsername,
  upsertUser,
  replaceAllUsers,
  deleteUserById,
  saveTransaction,
  getTransactions,
  deleteTransaction,
  getCategories,
  saveCategory,
  deleteCategory,
  getCreditAccounts,
  getCreditAccountByName,
  upsertCreditAccount,
  addToCreditAccount,
  payToCreditAccount,
  deleteCreditAccount,
  searchCreditAccounts,
  getCurrentTill,
  getTillHistory,
  startTill,
  endTill
};
