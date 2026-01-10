import { NextResponse } from "next/server";
const mongo = require("../../../../server/mongo");

export async function GET(req) {
  try {
    const inventoryReceived = await mongo.getInventoryReceived();
    return NextResponse.json(inventoryReceived);
  } catch (err) {
    console.error("GET /api/inventory-received error", err);
    return NextResponse.json({ error: "Failed to fetch inventory received" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { checkApiKey } = require("../../../../server/auth");
    if (!checkApiKey(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const record = await mongo.addInventoryReceived(body);
    return NextResponse.json(record);
  } catch (err) {
    console.error("POST /api/inventory-received error", err);
    return NextResponse.json({ error: "Failed to record inventory received" }, { status: 500 });
  }
}