import { NextRequest, NextResponse } from "next/server";
import { deleteBudgetByCategory, listBudgets, upsertBudget } from "@/lib/db";
import { budgetFormSchema } from "@/lib/validations";

export async function GET() {
  try {
    const budgets = await listBudgets();
    return NextResponse.json(budgets);
  } catch (error) {
    console.error("GET /api/budgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch budgets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = budgetFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { category, limitAmount } = parsed.data;
    const budget = await upsertBudget({ category, limitAmount });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("POST /api/budgets:", error);
    return NextResponse.json(
      { error: "Failed to save budget" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    await deleteBudgetByCategory(category);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/budgets:", error);
    return NextResponse.json(
      { error: "Failed to delete budget" },
      { status: 500 }
    );
  }
}
