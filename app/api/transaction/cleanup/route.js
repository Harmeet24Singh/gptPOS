import { NextResponse } from "next/server";
const mongo = require('../../../../server/mongo');

export async function POST(req) {
  try {
    const { checkApiKey } = require("../../../../server/auth");
    if (!checkApiKey(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, criteria } = body;

    if (action !== "cleanup") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const db = await mongo.connect();
    let result;

    // Different cleanup options
    switch (criteria) {
      case "test_items":
        // Delete transactions containing common test items
        result = await db.collection('transactions').deleteMany({
          "items.name": { 
            $regex: /test|demo|sample|example/i 
          }
        });
        break;

      case "today_transactions":
        // Delete all transactions from today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        result = await db.collection('transactions').deleteMany({
          timestamp: {
            $gte: today,
            $lt: tomorrow
          }
        });
        break;

      case "recent_hour":
        // Delete transactions from the last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        result = await db.collection('transactions').deleteMany({
          timestamp: { $gte: oneHourAgo }
        });
        break;

      case "small_amounts":
        // Delete transactions under $5 (likely test transactions)
        result = await db.collection('transactions').deleteMany({
          total: { $lt: 5 }
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid cleanup criteria" }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} transactions`
    });

  } catch (err) {
    console.error("POST /api/transaction/cleanup error", err);
    return NextResponse.json({ error: "Failed to cleanup transactions" }, { status: 500 });
  }
}