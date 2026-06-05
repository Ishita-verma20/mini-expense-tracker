import { NextRequest, NextResponse } from "next/server";
import { listExpenses } from "@/lib/db";
import { startOfMonth, endOfDay } from "date-fns";
import { EXPENSE_CATEGORIES } from "@/types";
import { getDateRangeFromPreset } from "@/lib/date-filters";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get("dateRange");
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;
    const category = searchParams.get("category");

    const query: {
      dateGte?: Date;
      dateLte?: Date;
      category?: string;
    } = {};

    if (dateRange === "this-month" || !dateRange) {
      const now = new Date();
      query.dateGte = startOfMonth(now);
      query.dateLte = endOfDay(now);
    } else if (dateRange === "last-month") {
      const { start, end } = getDateRangeFromPreset("last-month");
      if (start && end) {
        query.dateGte = start;
        query.dateLte = end;
      }
    } else if (dateRange === "custom" && startDate && endDate) {
      const { start, end } = getDateRangeFromPreset("all", startDate, endDate);
      if (start && end) {
        query.dateGte = start;
        query.dateLte = end;
      }
    }

    if (category && category !== "all") query.category = category;

    const expenses = await listExpenses(query);

    const categoryTotals: Record<string, number> = {};
    EXPENSE_CATEGORIES.forEach((cat) => {
      categoryTotals[cat] = 0;
    });

    let totalSpent = 0;
    let highestExpense = 0;

    expenses.forEach((e) => {
      totalSpent += e.amount;
      if (e.amount > highestExpense) highestExpense = e.amount;
      categoryTotals[e.category] =
        (categoryTotals[e.category] ?? 0) + e.amount;
    });

    return NextResponse.json({
      totalSpent,
      highestExpense,
      totalExpenses: expenses.length,
      categoryTotals,
    });
  } catch (error) {
    console.error("GET /api/summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch summary" },
      { status: 500 }
    );
  }
}
