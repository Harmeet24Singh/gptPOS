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
  const db = await connect();
  const ops = items.map((it) => {
    const obj = {
      id: it.id ? Number(it.id) : undefined,
      name: it.name || '',
      category: it.category || '',
      price: Number(it.price || 0),
      stock: Number(it.stock || 0),
      lowStockThreshold: Number(it.lowStockThreshold || 0),
      taxable: !!it.taxable,
    };
    // remove undefined id to let upsert use provided id or create one
    if (obj.id === undefined) delete obj.id;
    const filter = obj.id !== undefined ? { id: obj.id } : { name: obj.name };
    return {
      updateOne: {
        filter,
        update: { $set: obj },
        upsert: true,
      },
    };
  });
  if (ops.length === 0) return;
  await db.collection('inventory').bulkWrite(ops);
}

async function deleteInventoryById(id) {
  const db = await connect();
  const n = Number(id);
  await db.collection('inventory').deleteOne({ id: n });
}

// Users helpers
async function getUsers() {
  const db = await connect();
  return db.collection('users').find({}).sort({ username: 1 }).toArray();
}

async function getUserByUsername(username) {
  const db = await connect();
  return db.collection('users').findOne({ username });
}

async function upsertUser(body) {
  const db = await connect();
  const id = body.id || body.username;
  await db.collection('users').updateOne(
    { id },
    {
      $set: {
        id,
        username: body.username,
        role: body.role || 'user',
        permissions_json: JSON.stringify(body.permissions || {}),
      },
    },
    { upsert: true }
  );
}

// Transactions helpers
async function saveTransaction(txObj) {
  const db = await connect();
  // normalize timestamp
  const doc = {
    legacy_id: txObj.id || null,
    timestamp: txObj.timestamp ? new Date(txObj.timestamp) : new Date(),
    subtotal: Number(txObj.subtotal || 0),
    taxableAmount: Number(txObj.taxableAmount || 0),
    nonTaxableAmount: Number(txObj.nonTaxableAmount || 0),
    tax: Number(txObj.tax || 0),
    total: Number(txObj.total || 0),
    paymentBreakdown: txObj.paymentBreakdown || txObj.payment || [],
    change: Number(txObj.change || 0),
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
      const newStock = Math.max(0, (cur.stock || 0) - (it.quantity || 0));
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
    timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : r.timestamp,
  }));
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
  saveTransaction,
  getTransactions,
};
