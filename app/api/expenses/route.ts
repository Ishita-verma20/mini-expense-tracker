import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expenseApiSchema } from "@/lib/validations";
import { getDateRangeFromPreset, serializeExpense } from "@/lib/date-filters";
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

    const where: {
      category?: string;
      date?: { gte?: Date; lte?: Date };
    } = {};

    if (category && category !== "all" && EXPENSE_CATEGORIES.includes(category as ExpenseCategory)) {
      where.category = category;
    }

    if (dateRange === "custom" && startDate && endDate) {
      const { start, end } = getDateRangeFromPreset("all", startDate, endDate);
      if (start && end) {
        where.date = { gte: start, lte: end };
      }
    } else if (dateRange && dateRange !== "all" && dateRange !== "custom") {
      const { start, end } = getDateRangeFromPreset(
        dateRange as "this-month" | "last-month"
      );
      if (start && end) {
        where.date = { gte: start, lte: end };
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses.map(serializeExpense));
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

    const expense = await prisma.expense.create({
      data: {
        amount,
        category,
        date: new Date(date),
        note: note || null,
      },
    });

    return NextResponse.json(serializeExpense(expense), { status: 201 });
  } catch (error) {
    console.error("POST /api/expenses:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
