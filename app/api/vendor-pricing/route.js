import { NextResponse } from "next/server";
const mongo = require("../../../../server/mongo");

export async function GET(req) {
  try {
    const vendorPricing = await mongo.getVendorPricing();
    return NextResponse.json(vendorPricing);
  } catch (err) {
    console.error("GET /api/vendor-pricing error", err);
    return NextResponse.json({ error: "Failed to fetch vendor pricing" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { checkApiKey } = require("../../../../server/auth");
    if (!checkApiKey(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const pricing = await mongo.addVendorPricing(body);
    return NextResponse.json(pricing);
  } catch (err) {
    console.error("POST /api/vendor-pricing error", err);
    return NextResponse.json({ error: "Failed to add vendor pricing" }, { status: 500 });
  }
}