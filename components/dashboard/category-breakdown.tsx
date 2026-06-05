"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/currency";
import { EXPENSE_CATEGORIES } from "@/types";
import type { Budget, SummaryResponse } from "@/types";
import { AlertTriangle } from "lucide-react";

interface CategoryBreakdownProps {
  summary: SummaryResponse | null;
  budgets: Budget[];
  isLoading: boolean;
}

export function CategoryBreakdown({
  summary,
  budgets,
  isLoading,
}: CategoryBreakdownProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const totals = summary?.categoryTotals ?? {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {EXPENSE_CATEGORIES.map((cat) => {
          const spent = totals[cat] ?? 0;
          const budget = budgets.find((b) => b.category === cat);
          const exceeded = budget && spent > budget.limitAmount;

          if (spent === 0 && !budget) return null;

          return (
            <div
              key={cat}
              className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm ${
                exceeded ? "bg-red-50 dark:bg-red-950/30" : ""
              }`}
            >
              <span className="flex items-center gap-2 font-medium">
                {cat}
                {exceeded && (
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                )}
              </span>
              <div className="text-right">
                <span className="font-semibold">{formatINR(spent)}</span>
                {budget && (
                  <p className="text-xs text-muted-foreground">
                    Budget: {formatINR(budget.limitAmount)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {Object.values(totals).every((v) => v === 0) && (
          <p className="text-sm text-muted-foreground">No spending data yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
