import { NextResponse } from "next/server";
const mongo = require('../../../server/mongo');

export async function GET(req, { params }) {
  try {
    const row = await mongo.getInventoryById(params.id);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    console.error("GET /api/inventory/[id] error", err);
    return NextResponse.json({ error: "Failed to read item" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { checkApiKey } = require("../../../server/auth");
    if (!checkApiKey(req))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    // ensure id field is numeric
    body.id = Number(params.id);
    await mongo.upsertInventoryItems([body]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/inventory/[id] error", err);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { checkApiKey } = require("../../../server/auth");
    if (!checkApiKey(req))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await mongo.deleteInventoryById(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/inventory/[id] error", err);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
