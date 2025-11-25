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
    console.log("POST /api/inventory called");
    const { checkApiKey } = require("../../../server/auth");
    if (!checkApiKey(req)) {
      console.log("API key check failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("API key check passed");
    
    const body = await req.json();
    console.log("Request body type:", typeof body);
    console.log("Request body length:", Array.isArray(body) ? body.length : 'not array');
    
    // Accept either an array of items or single item
    let items = [];
    if (Array.isArray(body)) items = body;
    else if (body && Array.isArray(body.items)) items = body.items;
    else if (body && typeof body === "object") items = [body];

    console.log("Items to upsert:", items.length);
    if (items.length > 0) {
      console.log("First item sample:", JSON.stringify(items[0], null, 2));
    }

    if (!items || items.length === 0) {
      console.log("No items to upsert, returning success");
      return NextResponse.json({ ok: true });
    }
    
    console.log("Calling mongo.upsertInventoryItems...");
    await mongo.upsertInventoryItems(items);
    console.log("Upsert completed successfully");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/inventory error - Full error:", err);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    return NextResponse.json({ 
      error: "Failed to upsert inventory", 
      details: err.message,
      type: err.name 
    }, { status: 500 });
  }
}
