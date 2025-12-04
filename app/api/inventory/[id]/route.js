import { NextResponse } from "next/server";
const mongo = require("../../../../server/mongo");

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
    console.log("PUT /api/inventory/[id] called for ID:", params.id);
    const { checkApiKey } = require("../../../../server/auth");
    if (!checkApiKey(req)) {
      console.log("PUT API key check failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("PUT request body:", body);

    // ensure id field is numeric
    const numericId = Number(params.id);
    if (isNaN(numericId)) {
      console.log("Invalid ID provided:", params.id);
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    body.id = numericId;
    console.log("Upserting item with ID:", numericId);

    await mongo.upsertInventoryItems([body]);
    console.log("PUT upsert completed successfully");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/inventory/[id] error - Full error:", err);
    console.error("Error message:", err.message);
    return NextResponse.json(
      {
        error: "Failed to update item",
        details: err.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    console.log("DELETE /api/inventory/[id] called for ID:", params.id);

    const { checkApiKey } = require("../../../../server/auth");
    if (!checkApiKey(req)) {
      console.log("DELETE API key check failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("DELETE API key check passed");

    const id = params.id;
    console.log("Attempting to delete inventory item with ID:", id);

    await mongo.deleteInventoryById(id);
    console.log("Successfully deleted inventory item with ID:", id);

    return NextResponse.json({ ok: true, deletedId: id });
  } catch (err) {
    console.error("DELETE /api/inventory/[id] error - Full error:", err);
    console.error("Error message:", err.message);
    return NextResponse.json(
      {
        error: "Failed to delete item",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
