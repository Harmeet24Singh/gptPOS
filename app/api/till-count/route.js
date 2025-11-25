import { NextResponse } from "next/server";
const mongo = require('../../../server/mongo');

export async function GET(req) {
  try {
    const { checkApiKey } = require("../../../server/auth");
    if (!checkApiKey(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current open till and recent history
    const currentTill = await mongo.getCurrentTill();
    const history = await mongo.getTillHistory(20); // Get last 20 till records

    return NextResponse.json({
      currentTill,
      history
    });
  } catch (err) {
    console.error("GET /api/till-count error", err);
    return NextResponse.json({ 
      error: "Failed to fetch till data" 
    }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { checkApiKey } = require("../../../server/auth");
    if (!checkApiKey(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, startAmount, endAmount, denominations, userName } = body;

    if (action === 'start') {
      // Check if there's already an open till
      const currentTill = await mongo.getCurrentTill();
      if (currentTill) {
        return NextResponse.json({ 
          error: "A till is already open. Please close it before starting a new one." 
        }, { status: 400 });
      }

      if (!startAmount || startAmount < 0) {
        return NextResponse.json({ 
          error: "Valid start amount is required" 
        }, { status: 400 });
      }

      const till = await mongo.startTill({
        startAmount: parseFloat(startAmount),
        startUser: userName,
        startTime: new Date().toISOString(),
        startDenominations: denominations || {}
      });

      return NextResponse.json({ 
        success: true, 
        message: "Till started successfully",
        till 
      });
    }
    
    if (action === 'end') {
      // Check if there's an open till
      const currentTill = await mongo.getCurrentTill();
      if (!currentTill) {
        return NextResponse.json({ 
          error: "No open till found" 
        }, { status: 400 });
      }

      if (endAmount === undefined || endAmount < 0) {
        return NextResponse.json({ 
          error: "Valid end amount is required" 
        }, { status: 400 });
      }

      const updatedTill = await mongo.endTill(currentTill.id, {
        endAmount: parseFloat(endAmount),
        endUser: userName,
        endTime: new Date().toISOString(),
        endDenominations: denominations || {}
      });

      return NextResponse.json({ 
        success: true, 
        message: "Till closed successfully",
        till: updatedTill 
      });
    }

    return NextResponse.json({ 
      error: "Invalid action. Use 'start' or 'end'" 
    }, { status: 400 });

  } catch (err) {
    console.error("POST /api/till-count error", err);
    return NextResponse.json({ 
      error: "Failed to process till operation" 
    }, { status: 500 });
  }
}