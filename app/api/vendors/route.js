import { NextResponse } from "next/server";
const mongo = require("../../../../server/mongo");

export async function GET(req) {
  try {
    const vendors = await mongo.getVendors();
    return NextResponse.json(vendors);
  } catch (err) {
    console.error("GET /api/vendors error", err);
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { checkApiKey } = require("../../../../server/auth");
    if (!checkApiKey(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const vendor = await mongo.addVendor(body);
    return NextResponse.json(vendor);
  } catch (err) {
    console.error("POST /api/vendors error", err);
    return NextResponse.json({ error: "Failed to add vendor" }, { status: 500 });
  }
}