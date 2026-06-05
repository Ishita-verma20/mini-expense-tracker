import { NextRequest, NextResponse } from "next/server";
import { deleteExpense, getExpense, updateExpense } from "@/lib/db";
import { expenseApiSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = expenseApiSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { amount, category, date, note } = parsed.data;

    const expense = await updateExpense(id, {
      amount,
      category,
      date: new Date(date),
      note: note || null,
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("PUT /api/expenses/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await getExpense(id);
    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    await deleteExpense(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/expenses/[id]:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
