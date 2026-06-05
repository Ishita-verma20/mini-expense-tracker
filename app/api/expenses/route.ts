import { NextRequest, NextResponse } from "next/server";
import { createExpense, listExpenses } from "@/lib/db";
import { expenseApiSchema } from "@/lib/validations";
import { getDateRangeFromPreset } from "@/lib/date-filters";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const dateRange = searchParams.get("dateRange") as
      | "this-month"
      | "last-month"
      | "custom"
      | "all"
      | null;
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;

    const query: {
      category?: string;
      dateGte?: Date;
      dateLte?: Date;
    } = {};

    if (category && category !== "all" && EXPENSE_CATEGORIES.includes(category as ExpenseCategory)) {
      query.category = category;
    }

    if (dateRange === "custom" && startDate && endDate) {
      const { start, end } = getDateRangeFromPreset("all", startDate, endDate);
      if (start && end) {
        query.dateGte = start;
        query.dateLte = end;
      }
    } else if (dateRange && dateRange !== "all" && dateRange !== "custom") {
      const { start, end } = getDateRangeFromPreset(
        dateRange as "this-month" | "last-month"
      );
      if (start && end) {
        query.dateGte = start;
        query.dateLte = end;
      }
    }

    const expenses = await listExpenses(query);
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("GET /api/expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = expenseApiSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { amount, category, date, note } = parsed.data;

    const expense = await createExpense({
      amount,
      category,
      date: new Date(date),
      note: note || null,
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("POST /api/expenses:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
