import { NextResponse } from "next/server";
const mongo = require("../../../../server/mongo");

export async function GET(req) {
  try {
    const profitAnalysis = await mongo.getProfitAnalysis();
    return NextResponse.json(profitAnalysis);
  } catch (err) {
    console.error("GET /api/profit-analysis error", err);
    return NextResponse.json({ error: "Failed to fetch profit analysis" }, { status: 500 });
  }
}