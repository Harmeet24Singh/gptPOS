import { NextResponse } from "next/server";
const mongo = require('../../../../server/mongo');

export async function GET() {
  try {
    const visitedItems = await mongo.getVisitedItems();
    return NextResponse.json(visitedItems);
  } catch (err) {
    console.error("GET /api/inventory/visited error", err);
    return NextResponse.json({ error: "Failed to get visited items" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { checkApiKey } = require("../../../../server/auth");
    if (!checkApiKey(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { itemId, visited } = body;

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    await mongo.setVisitedItem(itemId, visited);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/inventory/visited error", err);
    return NextResponse.json({ error: "Failed to update visited status" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { checkApiKey } = require("../../../../server/auth");
    if (!checkApiKey(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await mongo.clearAllVisitedItems();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/inventory/visited error", err);
    return NextResponse.json({ error: "Failed to clear visited items" }, { status: 500 });
  }
}