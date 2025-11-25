import { NextResponse } from "next/server";
const mongo = require('../../../server/mongo');

export async function POST(req) {
  try {
    const { checkApiKey } = require("../../../server/auth");
    if (!checkApiKey(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();

    const insertedId = await mongo.saveTransaction(body);
    const rows = await mongo.getTransactions(1);
    const saved = rows && rows.length ? rows[0] : null;
    return NextResponse.json({ id: insertedId, transaction: saved });
  } catch (err) {
    console.error("POST /api/transaction error", err);
    return NextResponse.json({ error: "Failed to save transaction" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") || 100);
    const stats = url.searchParams.get("stats") === "true";
    
    if (stats) {
      // Return transaction statistics by type
      const db = await mongo.connect();
      const pipeline = [
        {
          $group: {
            _id: "$transactionType",
            count: { $sum: 1 },
            totalAmount: { $sum: "$total" },
            avgAmount: { $avg: "$total" },
            totalCash: { $sum: "$cashAmount" },
            totalCard: { $sum: "$cardAmount" },
            totalCredit: { $sum: "$creditAmount" }
          }
        },
        {
          $sort: { count: -1 }
        }
      ];
      
      const stats = await db.collection('transactions').aggregate(pipeline).toArray();
      
      // Also get overall totals
      const overallStats = await db.collection('transactions').aggregate([
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalRevenue: { $sum: "$total" },
            totalCashRevenue: { $sum: "$cashAmount" },
            totalCardRevenue: { $sum: "$cardAmount" },
            totalCreditAmount: { $sum: "$creditAmount" }
          }
        }
      ]).toArray();
      
      return NextResponse.json({
        byType: stats.map(stat => ({
          type: stat._id || 'unknown',
          count: stat.count,
          totalAmount: Number(stat.totalAmount.toFixed(2)),
          avgAmount: Number(stat.avgAmount.toFixed(2)),
          totalCash: Number(stat.totalCash.toFixed(2)),
          totalCard: Number(stat.totalCard.toFixed(2)),
          totalCredit: Number(stat.totalCredit.toFixed(2))
        })),
        overall: overallStats[0] ? {
          totalTransactions: overallStats[0].totalTransactions,
          totalRevenue: Number(overallStats[0].totalRevenue.toFixed(2)),
          totalCashRevenue: Number(overallStats[0].totalCashRevenue.toFixed(2)),
          totalCardRevenue: Number(overallStats[0].totalCardRevenue.toFixed(2)),
          totalCreditAmount: Number(overallStats[0].totalCreditAmount.toFixed(2))
        } : null
      });
    } else {
      // Return regular transaction list
      const rows = await mongo.getTransactions(limit);
      return NextResponse.json(rows);
    }
  } catch (err) {
    console.error("GET /api/transaction error", err);
    return NextResponse.json({ error: "Failed to read transactions" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { checkApiKey } = require("../../../server/auth");
    if (!checkApiKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = await mongo.connect();
    await db.collection('transactions').deleteMany({});
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/transaction error", err);
    return NextResponse.json({ error: "Failed to clear transactions" }, { status: 500 });
  }
}
