import { NextResponse } from "next/server";
const mongo = require('../../../../server/mongo');

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Delete user from database (with admin protection)
    await mongo.deleteUserById(id);
    
    console.log(`API: Deleted user with id: ${id}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/users/[id] error", err);
    
    // Check if it's an admin protection error
    if (err.message && err.message.includes('Admin users cannot be deleted')) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Update user in database
    body.id = id; // Ensure the ID matches
    await mongo.upsertUser(body);
    
    console.log(`API: Updated user with id: ${id}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/users/[id] error", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function GET(req, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Get user from database
    const user = await mongo.getUserByUsername(id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse permissions
    try {
      user.permissions = JSON.parse(user.permissions_json || "{}");
    } catch (e) {
      user.permissions = {};
    }
    
    return NextResponse.json(user);
  } catch (err) {
    console.error("GET /api/users/[id] error", err);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}