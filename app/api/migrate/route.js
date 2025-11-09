import { NextResponse } from "next/server";

// Migration endpoint: import inventory and transactions from a client-uploaded JSON
export async function POST(req) {
  try {
    const { checkApiKey } = require("../../../server/auth");
    if (!checkApiKey(req))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const mongo = require("../../../server/mongo");
    let inventoryCount = 0;
    let transactionCount = 0;

    if (Array.isArray(body.inventory) && body.inventory.length > 0) {
      await mongo.upsertInventoryItems(body.inventory);
      inventoryCount = body.inventory.length;
    }

    if (Array.isArray(body.transactions) && body.transactions.length > 0) {
      for (const tx of body.transactions) {
        await mongo.saveTransaction(tx);
        transactionCount += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      imported: { inventory: inventoryCount, transactions: transactionCount },
    });
  } catch (err) {
    console.error("Migration error", err);
    try {
        /* attempt to close DB if available */
        const mongo = require("../../../server/mongo");
        const db = await mongo.connect();
        if (db && db.client) {
          try { db.client.close(); } catch (e) {}
        }
    } catch (e) {}
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
