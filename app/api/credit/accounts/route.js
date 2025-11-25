import { NextResponse } from "next/server";
const mongo = require('../../../../server/mongo');

export async function GET(req) {
  try {
    // Skip authentication for frontend access
    // const { checkApiKey } = require("../../../../server/auth");
    // if (!checkApiKey(req)) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    const includeInactive = url.searchParams.get("includeInactive") === "true";

    let accounts;
    
    if (search && search.trim().length >= 1) {
      // Search for specific accounts
      accounts = await mongo.searchCreditAccounts(search, includeInactive);
    } else {
      // Get all accounts
      accounts = await mongo.getCreditAccounts();
      
      if (!includeInactive) {
        accounts = accounts.filter(account => account.isActive !== false);
      }
    }

    // Filter out accounts with zero balance unless specifically requested
    const showZeroBalances = url.searchParams.get("showZeroBalances") === "true";
    if (!showZeroBalances) {
      accounts = accounts.filter(account => Number(account.balance || 0) > 0);
    }

    // Calculate summary statistics
    const summary = {
      totalAccounts: accounts.length,
      totalBalance: accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0),
      activeAccounts: accounts.filter(account => account.isActive !== false).length,
      accountsWithBalance: accounts.filter(account => Number(account.balance || 0) > 0).length
    };

    return NextResponse.json({
      accounts,
      summary
    });

  } catch (err) {
    console.error("GET /api/credit/accounts error", err);
    return NextResponse.json({ error: "Failed to fetch credit accounts" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    // Skip authentication for frontend access
    // const { checkApiKey } = require("../../../../server/auth");
    // if (!checkApiKey(req)) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = await req.json();
    
    // Check if this is an addCredit action from POS
    if (body.action === 'addCredit') {
      const { customerName, amount, transactionId } = body;
      
      if (!customerName || !customerName.trim()) {
        return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
      }
      
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: "Valid credit amount is required" }, { status: 400 });
      }

      // Add credit to customer account (creates account if it doesn't exist)
      const account = await mongo.addToCreditAccount(customerName.trim(), Number(amount), transactionId);
      
      return NextResponse.json({
        success: true,
        message: `Added $${Number(amount).toFixed(2)} to ${customerName.trim()}'s credit account`,
        account
      });
    }

    // Check if this is a payment action from POS
    if (body.action === 'payment') {
      const { customerName, amount } = body;
      
      if (!customerName || !customerName.trim()) {
        return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
      }
      
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: "Valid payment amount is required" }, { status: 400 });
      }

      try {
        // Process payment on customer account
        const result = await mongo.payToCreditAccount(customerName.trim(), Number(amount));
        
        return NextResponse.json({
          success: true,
          message: `Payment of $${Number(amount).toFixed(2)} processed for ${customerName.trim()}`,
          ...result
        });
      } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    // Default account creation/update logic
    const { customerName, balance = 0, phone = '', email = '', address = '', notes = '', isActive = true } = body;

    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    const account = await mongo.upsertCreditAccount({
      customerName: customerName.trim(),
      balance: Number(balance),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      notes: notes.trim(),
      isActive: Boolean(isActive),
      transactionCount: 0,
      lastTransactionDate: new Date()
    });

    return NextResponse.json({ 
      success: true,
      account
    });

  } catch (err) {
    console.error("POST /api/credit/accounts error", err);
    return NextResponse.json({ error: err.message || "Failed to process credit account request" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { checkApiKey } = require("../../../../server/auth");
    if (!checkApiKey(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { customerName, balance, phone, email, address, notes, isActive } = body;

    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    // Get existing account to preserve data
    const existingAccount = await mongo.getCreditAccountByName(customerName);
    if (!existingAccount) {
      return NextResponse.json({ error: "Credit account not found" }, { status: 404 });
    }

    const account = await mongo.upsertCreditAccount({
      customerName: customerName.trim(),
      balance: balance !== undefined ? Number(balance) : existingAccount.balance,
      phone: phone !== undefined ? phone.trim() : existingAccount.phone,
      email: email !== undefined ? email.trim() : existingAccount.email,
      address: address !== undefined ? address.trim() : existingAccount.address,
      notes: notes !== undefined ? notes.trim() : existingAccount.notes,
      isActive: isActive !== undefined ? Boolean(isActive) : existingAccount.isActive,
      transactionCount: existingAccount.transactionCount,
      lastTransactionDate: existingAccount.lastTransactionDate
    });

    return NextResponse.json({ 
      success: true,
      account
    });

  } catch (err) {
    console.error("PUT /api/credit/accounts error", err);
    return NextResponse.json({ error: err.message || "Failed to update credit account" }, { status: 500 });
  }
}