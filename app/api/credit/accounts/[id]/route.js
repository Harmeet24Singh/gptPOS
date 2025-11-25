import { NextResponse } from "next/server";
const mongo = require('../../../../../server/mongo');

export async function GET(req, { params }) {
  try {
    const { checkApiKey } = require("../../../../../server/auth");
    if (!checkApiKey(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    
    // Try to get account by ID first, then by name
    let account;
    if (id.length === 24) { // MongoDB ObjectId length
      // Get by ID
      const db = await mongo.connect();
      const { ObjectId } = require('mongodb');
      
      try {
        const objectId = new ObjectId(id);
        account = await db.collection('creditAccounts').findOne({ _id: objectId });
        if (account) {
          account.id = account._id.toString();
        }
      } catch (error) {
        // Invalid ObjectId, try by name
        account = await mongo.getCreditAccountByName(decodeURIComponent(id));
      }
    } else {
      // Get by customer name
      account = await mongo.getCreditAccountByName(decodeURIComponent(id));
    }

    if (!account) {
      return NextResponse.json({ error: "Credit account not found" }, { status: 404 });
    }

    return NextResponse.json({ account });

  } catch (err) {
    console.error("GET /api/credit/accounts/[id] error", err);
    return NextResponse.json({ error: "Failed to fetch credit account" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { checkApiKey } = require("../../../../../server/auth");
    if (!checkApiKey(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    
    let success = false;
    
    if (id.length === 24) { // MongoDB ObjectId length
      success = await mongo.deleteCreditAccount(id);
    } else {
      // Delete by name - first get account to get ID
      const account = await mongo.getCreditAccountByName(decodeURIComponent(id));
      if (account) {
        success = await mongo.deleteCreditAccount(account.id);
      }
    }

    if (!success) {
      return NextResponse.json({ error: "Credit account not found or could not be deleted" }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("DELETE /api/credit/accounts/[id] error", err);
    return NextResponse.json({ error: "Failed to delete credit account" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { checkApiKey } = require("../../../../../server/auth");
    if (!checkApiKey(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { action, amount, paymentMethod } = body;

    // Get account by ID or name
    let account;
    if (id.length === 24) { // MongoDB ObjectId length
      const db = await mongo.connect();
      const { ObjectId } = require('mongodb');
      
      try {
        const objectId = new ObjectId(id);
        account = await db.collection('creditAccounts').findOne({ _id: objectId });
        if (account) {
          account.id = account._id.toString();
          account.customerName = account.customerName;
        }
      } catch (error) {
        account = await mongo.getCreditAccountByName(decodeURIComponent(id));
      }
    } else {
      account = await mongo.getCreditAccountByName(decodeURIComponent(id));
    }

    if (!account) {
      return NextResponse.json({ error: "Credit account not found" }, { status: 404 });
    }

    if (action === 'addCredit') {
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
      }

      const updatedAccount = await mongo.addToCreditAccount(account.customerName, amount);
      
      return NextResponse.json({ 
        success: true,
        account: updatedAccount,
        action: 'creditAdded',
        amount: Number(amount)
      });

    } else if (action === 'makePayment') {
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: "Valid payment amount is required" }, { status: 400 });
      }

      const result = await mongo.payToCreditAccount(account.customerName, amount);
      
      return NextResponse.json({ 
        success: true,
        account: result,
        action: 'paymentMade',
        paymentAmount: result.paymentAmount,
        previousBalance: result.previousBalance,
        newBalance: result.newBalance,
        paymentMethod: paymentMethod || 'cash'
      });

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (err) {
    console.error("PATCH /api/credit/accounts/[id] error", err);
    return NextResponse.json({ error: err.message || "Failed to process account operation" }, { status: 500 });
  }
}