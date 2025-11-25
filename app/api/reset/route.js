import { NextResponse } from "next/server";

export async function POST() {
  try {
    // This endpoint can be used to reset localStorage data for testing
    // In a real application, this would clear the database
    return NextResponse.json({ 
      message: "Reset endpoint called - clear localStorage in browser to reset users data",
      instructions: "Open browser dev tools (F12) -> Application tab -> Local Storage -> localhost -> Delete 'users' and 'currentUser' keys, then refresh"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process reset request" },
      { status: 500 }
    );
  }
}