"use client";

import { format } from "date-fns";
import { Edit3, Trash, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { Budget, Expense, ExpenseCategory } from "@/types";

interface ExpenseListProps {
  expenses: Expense[];
  budgets: Budget[];
  categoryTotals: Record<string, number>;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

function isBudgetExceeded(
  category: ExpenseCategory,
  budgets: Budget[],
  categoryTotals: Record<string, number>
) {
  const budget = budgets.find((b) => b.category === category);
  if (!budget) return false;
  return (categoryTotals[category] ?? 0) > budget.limitAmount;
}

export function ExpenseList({
  expenses,
  budgets,
  categoryTotals,
  onEdit,
  onDelete,
}: ExpenseListProps) {
  return (
    <div className="space-y-3">
      {expenses.map((expense) => {
        const exceeded = isBudgetExceeded(
          expense.category,
          budgets,
          categoryTotals
        );

        return (
          <div
            key={expense.id}
            className={cn(
              "flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between",
              exceeded && "border-red-500"
            )}
          >
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold">
                  {formatINR(expense.amount)}
                </span>
                <Badge variant="secondary">{expense.category}</Badge>
                {exceeded && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Over budget
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(expense.date), "dd MMM yyyy")}
                {expense.note && ` · ${expense.note}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onEdit(expense)}
                aria-label="Edit expense"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onDelete(expense)}
                aria-label="Delete expense"
              >
                <Trash className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
