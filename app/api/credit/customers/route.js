import { NextResponse } from "next/server";
const mongo = require('../../../../server/mongo');

export async function GET(req) {
  try {
    const { checkApiKey } = require("../../../../server/auth");
    if (!checkApiKey(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get("search");

    if (!search || search.trim().length < 1) {
      return NextResponse.json({ customers: [] });
    }

    // Use the new credit accounts table for customer search
    const accounts = await mongo.searchCreditAccounts(search, false); // false = exclude inactive accounts
    
    // Filter accounts with positive balance
    const customersWithBalance = accounts.filter(account => Number(account.balance || 0) > 0);

    // Format the response to match the expected structure
    const formattedCustomers = customersWithBalance.map(account => ({
      customerName: account.customerName,
      totalUnpaid: Number(account.balance || 0),
      unpaidTransactions: account.transactionCount || 0,
      lastTransactionDate: account.lastTransactionDate,
      phone: account.phone || '',
      email: account.email || '',
      address: account.address || '',
      notes: account.notes || '',
      accountId: account.id
    }));

    return NextResponse.json({ customers: formattedCustomers });

  } catch (err) {
    console.error("GET /api/credit/customers error", err);
    return NextResponse.json({ error: "Failed to search customers" }, { status: 500 });
  }
}