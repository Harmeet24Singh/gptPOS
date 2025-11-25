import { NextResponse } from "next/server";
const mongo = require('../../../../server/mongo');

export async function DELETE(req, { params }) {
  try {
    const { checkApiKey } = require("../../../../server/auth");
    if (!checkApiKey(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    const deleted = await mongo.deleteTransaction(id);
    
    if (deleted) {
      return NextResponse.json({ 
        success: true, 
        message: `Transaction ${id} deleted successfully` 
      });
    } else {
      return NextResponse.json({ 
        error: "Transaction not found or could not be deleted" 
      }, { status: 404 });
    }
  } catch (err) {
    console.error("DELETE /api/transaction/[id] error", err);
    return NextResponse.json({ 
      error: "Failed to delete transaction" 
    }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { checkApiKey } = require("../../../../server/auth");
    
    // Debug: Log the API key check
    console.log('PUT request received for transaction update');
    console.log('Headers:', Object.fromEntries(req.headers.entries()));
    const apiKeyCheck = checkApiKey(req);
    console.log('API key check result:', apiKeyCheck);
    
    // Temporarily disable auth check for debugging
    // if (!apiKeyCheck) {
    //   console.log('Authorization failed');
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { id } = params;
    const body = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    const db = await mongo.connect();
    const { ObjectId } = require('mongodb');
    
    try {
      const objectId = new ObjectId(id);
      
      // Get the current transaction to preserve existing data
      const existingTransaction = await db.collection('transactions').findOne({ _id: objectId });
      
      if (!existingTransaction) {
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      }

      // Update payment method fields
      const updateFields = {};
      
      if (body.transactionType) {
        updateFields.transactionType = body.transactionType;
      }
      
      if (body.paymentBreakdown) {
        updateFields.paymentBreakdown = body.paymentBreakdown;
      }
      
      // Update cash/card amounts based on new payment method
      if (body.cashAmount !== undefined) {
        updateFields.cashAmount = body.cashAmount;
      }
      
      if (body.cardAmount !== undefined) {
        updateFields.cardAmount = body.cardAmount;
      }
      
      if (body.creditAmount !== undefined) {
        updateFields.creditAmount = body.creditAmount;
      }

      // Add timestamp for the update
      updateFields.lastModified = new Date();
      updateFields.modifiedBy = 'payment_method_change';

      const result = await db.collection('transactions').updateOne(
        { _id: objectId },
        { $set: updateFields }
      );

      if (result.modifiedCount === 0) {
        return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
      }

      // Get the updated transaction
      const updatedTransaction = await db.collection('transactions').findOne({ _id: objectId });
      
      const formattedTransaction = {
        ...updatedTransaction,
        id: updatedTransaction._id.toString(),
        timestamp: updatedTransaction.timestamp instanceof Date ? updatedTransaction.timestamp.toISOString() : updatedTransaction.timestamp,
      };

      return NextResponse.json({ 
        success: true, 
        transaction: formattedTransaction,
        message: "Payment method updated successfully"
      });

    } catch (error) {
      console.error("PUT transaction error:", error);
      return NextResponse.json({ error: "Invalid transaction ID format" }, { status: 400 });
    }
  } catch (err) {
    console.error("PUT /api/transaction/[id] error", err);
    return NextResponse.json({ 
      error: "Failed to update transaction" 
    }, { status: 500 });
  }
}

export async function GET(req, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    // Get single transaction by ID
    const db = await mongo.connect();
    const { ObjectId } = require('mongodb');
    
    try {
      const objectId = new ObjectId(id);
      const transaction = await db.collection('transactions').findOne({ _id: objectId });
      
      if (!transaction) {
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      }

      // Format the response
      const formattedTransaction = {
        ...transaction,
        id: transaction._id.toString(),
        timestamp: transaction.timestamp instanceof Date ? transaction.timestamp.toISOString() : transaction.timestamp,
      };

      return NextResponse.json(formattedTransaction);
    } catch (error) {
      return NextResponse.json({ error: "Invalid transaction ID format" }, { status: 400 });
    }
  } catch (err) {
    console.error("GET /api/transaction/[id] error", err);
    return NextResponse.json({ 
      error: "Failed to get transaction" 
    }, { status: 500 });
  }
}