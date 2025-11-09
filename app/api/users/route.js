import { NextResponse } from "next/server";
const mongo = require('../../../server/mongo');

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");
    if (username) {
      const row = await mongo.getUserByUsername(username);
      if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
      try {
        row.permissions = JSON.parse(row.permissions_json || "{}");
      } catch (e) {
        row.permissions = {};
      }
      return NextResponse.json(row);
    }
    const rows = await mongo.getUsers();
    return NextResponse.json(
      rows.map((r) => ({
        ...r,
        permissions: (() => {
          try {
            return JSON.parse(r.permissions_json || "{}");
          } catch (e) {
            return {};
          }
        })(),
      }))
    );
  } catch (err) {
    console.error("GET /api/users error", err);
    return NextResponse.json({ error: "Failed to read users" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const key = req.headers && typeof req.headers.get === "function" ? req.headers.get("x-api-key") : null;
    const API_KEY = process.env.API_KEY || "dev-secret";
    if (key !== API_KEY) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    await mongo.upsertUser(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/users error", err);
    return NextResponse.json({ error: "Failed to upsert user" }, { status: 500 });
  }
}
