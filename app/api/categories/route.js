import { NextResponse } from "next/server";
import { getCategories, saveCategory, deleteCategory } from "../../../server/mongo";

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to get categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const category = await request.json();
    
    if (!category.name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const result = await saveCategory(category);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to save category:", error);
    return NextResponse.json({ error: "Failed to save category" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const result = await deleteCategory(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}