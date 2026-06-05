import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format, startOfMonth, subMonths } from "date-fns";

export async function GET() {
  try {
    const now = new Date();
    const months: { label: string; start: Date; end: Date }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      months.push({
        label: format(d, "MMM yyyy"),
        start,
        end,
      });
    }

    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: months[0].start },
      },
    });

    const monthlyData = months.map((m) => {
      const total = expenses
        .filter((e) => e.date >= m.start && e.date <= m.end)
        .reduce((sum, e) => sum + e.amount, 0);
      return { month: m.label, total };
    });

    return NextResponse.json(monthlyData);
  } catch (error) {
    console.error("GET /api/analytics/monthly:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly analytics" },
      { status: 500 }
    );
  }
}
