import { NextResponse } from "next/server";
const mongo = require('../../../server/mongo');

export async function GET() {
  try {
    const rows = await mongo.getAllInventory();
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/inventory error", err);
    return NextResponse.json({ error: "Failed to read inventory" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { checkApiKey } = require("../../../server/auth");
    if (!checkApiKey(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    // Accept either an array of items or single item
    let items = [];
    if (Array.isArray(body)) items = body;
    else if (body && Array.isArray(body.items)) items = body.items;
    else if (body && typeof body === "object") items = [body];

    if (!items || items.length === 0) return NextResponse.json({ ok: true });
    await mongo.upsertInventoryItems(items);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/inventory error", err);
    return NextResponse.json({ error: "Failed to upsert inventory" }, { status: 500 });
  }
}
