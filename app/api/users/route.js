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
    const body = await req.json();
    
    // Handle both single user and batch operations
    if (Array.isArray(body)) {
      // Batch operation - replace all users
      console.log('API: Batch updating', body.length, 'users');
      await mongo.replaceAllUsers(body);
    } else {
      // Single user operation
      console.log('API: Upserting user:', body.username || body.id);
      await mongo.upsertUser(body);
    }
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/users error", err);
    return NextResponse.json({ error: "Failed to upsert user" }, { status: 500 });
  }
}
