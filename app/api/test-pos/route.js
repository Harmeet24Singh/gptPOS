import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test endpoint to check user permissions and POS access
    return NextResponse.json({
      message: "POS Access Test Endpoint",
      timestamp: new Date().toISOString(),
      instructions: {
        admin: "Login with admin/admin123 - should have full POS access",
        cashier: "Login with cashier1/cashier123 - should have same POS access as admin",
        manager: "Login with manager1/manager123 - should have same POS access as admin",
      },
      testSteps: [
        "1. Go to /login and login with different users",
        "2. Navigate to /pos page",
        "3. Verify all users see the same POS interface",
        "4. Check that product grid, cart, and checkout are all accessible"
      ],
      expectedResult: "All user roles should see identical POS functionality"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Test endpoint error", details: error.message },
      { status: 500 }
    );
  }
}