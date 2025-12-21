import { NextResponse } from "next/server";
const { MongoClient } = require("mongodb");

export async function GET(req) {
  const client = new MongoClient("mongodb://localhost:27017", {
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const db = client.db("convenience_store");

    const results = await db
      .collection("transactions")
      .find({
        timestamp: {
          $gte: new Date("2025-09-01T00:00:00.000Z"),
          $lt: new Date("2025-10-01T00:00:00.000Z"),
        },
      })
      .sort({ _id: -1 })
      .limit(50000)
      .toArray();

    await client.close();

    return NextResponse.json({
      count: results.length,
      firstTransaction: results[0]
        ? {
            id: results[0]._id.toString(),
            timestamp: results[0].timestamp,
            total: results[0].total,
          }
        : null,
      lastTransaction: results[results.length - 1]
        ? {
            id: results[results.length - 1]._id.toString(),
            timestamp: results[results.length - 1].timestamp,
            total: results[results.length - 1].total,
          }
        : null,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
