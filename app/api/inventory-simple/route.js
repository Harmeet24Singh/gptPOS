import { NextResponse } from "next/server";

// Fallback inventory data
const defaultInventory = [
  {
    id: 1,
    name: "Coca Cola 355ml",
    category: "Beverages",
    price: 1.5,
    stock: 24,
    lowStockThreshold: 10,
    taxable: true,
  },
  {
    id: 2,
    name: "Lays Classic Chips",
    category: "Snacks",
    price: 2.99,
    stock: 8,
    lowStockThreshold: 15,
    taxable: true,
  },
  {
    id: 3,
    name: "Wonder Bread",
    category: "Bakery",
    price: 3.49,
    stock: 12,
    lowStockThreshold: 5,
    taxable: false,
  },
  {
    id: 4,
    name: "Marlboro Gold",
    category: "Tobacco",
    price: 12.99,
    stock: 3,
    lowStockThreshold: 5,
    taxable: true,
  },
  {
    id: 5,
    name: "Marlboro Red",
    category: "Tobacco",
    price: 12.99,
    stock: 5,
    lowStockThreshold: 5,
    taxable: true,
  },
  {
    id: 6,
    name: "Camel Blue",
    category: "Tobacco",
    price: 13.49,
    stock: 4,
    lowStockThreshold: 5,
    taxable: true,
  },
  {
    id: 7,
    name: "Newport Menthol",
    category: "Tobacco",
    price: 13.99,
    stock: 6,
    lowStockThreshold: 5,
    taxable: true,
  },
  {
    id: 8,
    name: "Red Bull 250ml",
    category: "Beverages",
    price: 3.99,
    stock: 18,
    lowStockThreshold: 8,
    taxable: true,
  },
  {
    id: 9,
    name: "Milk 1L",
    category: "Dairy",
    price: 2.79,
    stock: 15,
    lowStockThreshold: 5,
    taxable: false,
  },
  {
    id: 10,
    name: "Banana (each)",
    category: "Fresh Produce",
    price: 0.89,
    stock: 25,
    lowStockThreshold: 10,
    taxable: false,
  },
  {
    id: 11,
    name: "Coffee Cup 12oz",
    category: "Beverages",
    price: 1.99,
    stock: 30,
    lowStockThreshold: 10,
    taxable: true,
  }
];

export async function GET() {
  try {
    // Return the default inventory - this ensures POS always has products to show
    return NextResponse.json(defaultInventory);
  } catch (error) {
    console.error("Inventory API error:", error);
    return NextResponse.json(
      { error: "Failed to load inventory" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    // For now, just return success - in a real app this would update the database
    console.log("Inventory update request received");
    return NextResponse.json({ success: true, message: "Inventory updated" });
  } catch (error) {
    console.error("Inventory update error:", error);
    return NextResponse.json(
      { error: "Failed to update inventory" },
      { status: 500 }
    );
  }
}