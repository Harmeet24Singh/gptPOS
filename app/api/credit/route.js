import { NextResponse } from "next/server";
const mongo = require('../../../server/mongo');

export async function GET(req) {
  try {
    const { checkApiKey } = require("../../../server/auth");
    if (!checkApiKey(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const date = url.searchParams.get("date"); // Format: YYYY-MM-DD
    const status = url.searchParams.get("status") || "all"; // unpaid, paid, all

    const db = await mongo.connect();
    
    let query = { isCreditSale: true };
    
    // Filter by date if provided
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      query.timestamp = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    // Filter by credit status if specified
    if (status !== "all") {
      query.creditStatus = status;
    }

    const creditTransactions = await db
      .collection('transactions')
      .find(query)
      .sort({ timestamp: -1 })
      .toArray();

    // Calculate summary
    const summary = {
      totalCredits: creditTransactions.length,
      unpaidCredits: creditTransactions.filter(t => t.creditStatus === 'unpaid').length,
      paidCredits: creditTransactions.filter(t => t.creditStatus === 'paid').length,
      totalUnpaidAmount: creditTransactions
        .filter(t => t.creditStatus === 'unpaid')
        .reduce((sum, t) => sum + t.finalTotal, 0),
      totalPaidAmount: creditTransactions
        .filter(t => t.creditStatus === 'paid')
        .reduce((sum, t) => sum + t.finalTotal, 0)
    };

    return NextResponse.json({
      transactions: creditTransactions,
      summary
    });
  } catch (err) {
    console.error("GET /api/credit error", err);
    return NextResponse.json({ error: "Failed to fetch credit transactions" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { checkApiKey } = require("../../../server/auth");
    if (!checkApiKey(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { transactionId, action, paymentMethod } = body;

    if (!transactionId || !action) {
      return NextResponse.json({ error: "Transaction ID and action required" }, { status: 400 });
    }

    const db = await mongo.connect();
    const { ObjectId } = require('mongodb');

    if (action === 'markPaid') {
      // Mark credit sale as paid and update inventory (only for full credit sales)
      const transaction = await db
        .collection('transactions')
        .findOne({ _id: new ObjectId(transactionId) });

      if (!transaction) {
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      }

      if (!transaction.isCreditSale || transaction.creditStatus === 'paid') {
        return NextResponse.json({ error: "Invalid transaction for payment" }, { status: 400 });
      }

      // Update transaction status
      await db
        .collection('transactions')
        .updateOne(
          { _id: new ObjectId(transactionId) },
          { 
            $set: { 
              creditStatus: 'paid',
              creditPaidDate: new Date(),
              creditPaymentMethod: paymentMethod || 'cash'
            } 
          }
        );

      // Only update inventory if this was a full credit sale (no partial payment)
      // Partial payments already updated inventory when the sale was made
      if (!transaction.isPartialPayment && transaction.items && transaction.items.length > 0) {
        for (const item of transaction.items) {
          if (item.isManual) continue; // Skip manual items
          
          try {
            await db
              .collection('inventory')
              .updateOne(
                { _id: new ObjectId(item.id) },
                { $inc: { quantity: -item.quantity } }
              );
          } catch (inventoryErr) {
            console.error(`Error updating inventory for item ${item.id}:`, inventoryErr);
          }
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: transaction.isPartialPayment 
          ? "Credit balance marked as paid"
          : "Credit sale marked as paid and inventory updated"
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("PATCH /api/credit error", err);
    return NextResponse.json({ error: "Failed to update credit transaction" }, { status: 500 });
  }
}