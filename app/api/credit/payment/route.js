import { NextResponse } from "next/server";
const mongo = require('../../../../server/mongo');

export async function POST(req) {
  try {
    const { checkApiKey } = require("../../../../server/auth");
    if (!checkApiKey(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { customerName, paymentAmount, paymentMethod = 'cash', isFullPayment = false } = body;

    if (!customerName || !paymentAmount || paymentAmount <= 0) {
      return NextResponse.json({ error: "Customer name and payment amount are required" }, { status: 400 });
    }

    // Use the new credit accounts system
    const account = await mongo.getCreditAccountByName(customerName);
    
    if (!account) {
      return NextResponse.json({ error: "Credit account not found for this customer" }, { status: 404 });
    }

    const currentBalance = Number(account.balance || 0);
    
    if (paymentAmount > currentBalance) {
      return NextResponse.json({ error: "Payment amount exceeds account balance" }, { status: 400 });
    }

    if (currentBalance <= 0) {
      return NextResponse.json({ error: "No outstanding balance for this customer" }, { status: 400 });
    }

    // Process payment through the credit account system
    const result = await mongo.payToCreditAccount(customerName, paymentAmount);

    // Create a payment transaction record for POS history
    const db = await mongo.connect();
    const summaryTransaction = {
      timestamp: new Date(),
      subtotal: 0,
      taxableAmount: 0,
      nonTaxableAmount: 0,
      tax: 0,
      total: paymentAmount,
      cashback: 0,
      paymentBreakdown: [{
        method: paymentMethod,
        amount: paymentAmount
      }],
      change: 0,
      transactionType: paymentMethod === 'cash' ? 'cash' : 'card',
      cashAmount: paymentMethod === 'cash' ? paymentAmount : 0,
      cardAmount: paymentMethod === 'card' ? paymentAmount : 0,
      creditAmount: 0,
      isCreditPayment: true,
      creditCustomerName: customerName,
      creditAccountPayment: true, // Mark as credit account payment
      items: [{
        id: null,
        name: `Credit Payment - ${customerName}`,
        category: 'Credit Payment',
        quantity: 1,
        price: paymentAmount,
        taxable: false,
        isManual: true
      }]
    };

    const summaryResult = await db.collection('transactions').insertOne(summaryTransaction);

    return NextResponse.json({
      success: true,
      paymentAmount: result.paymentAmount,
      customerName,
      previousBalance: result.previousBalance,
      newBalance: result.newBalance,
      remainingBalance: result.newBalance,
      summaryTransactionId: summaryResult.insertedId.toString(),
      paymentMethod,
      accountId: account.id
    });

  } catch (err) {
    console.error("POST /api/credit/payment error", err);
    return NextResponse.json({ error: err.message || "Failed to process credit payment" }, { status: 500 });
  }
}