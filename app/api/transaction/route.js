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
    const rows = await mongo.getTransactions(limit);
    return NextResponse.json(rows);
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
