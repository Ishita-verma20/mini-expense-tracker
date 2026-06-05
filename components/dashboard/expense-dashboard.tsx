"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { apiUrl } from "@/lib/api";
import { ExpenseFilters } from "@/components/dashboard/expense-filters";
import { BudgetSettings } from "@/components/dashboard/budget-settings";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { MonthlyBarChart } from "@/components/charts/monthly-bar-chart";
import { ExpenseDialog } from "@/components/expense/expense-dialog";
import { DeleteExpenseDialog } from "@/components/expense/delete-expense-dialog";
import { ExpenseList } from "@/components/expense/expense-list";
import { EmptyState } from "@/components/expense/empty-state";
import { exportExpensesToCSV } from "@/lib/csv-export";
import type { ExpenseFormValues } from "@/lib/validations";
import type {
  Budget,
  DateRangePreset,
  Expense,
  SummaryResponse,
} from "@/types";

function buildQueryParams(
  category: string,
  dateRange: DateRangePreset,
  startDate: string,
  endDate: string
) {
  const params = new URLSearchParams();
  if (category !== "all") params.set("category", category);
  if (dateRange !== "all") {
    params.set("dateRange", dateRange);
    if (dateRange === "custom") {
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
    }
  }
  return params.toString();
}

export function ExpenseDashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [monthSummary, setMonthSummary] = useState<SummaryResponse | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState("all");
  const [dateRange, setDateRange] = useState<DateRangePreset>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const queryString = useMemo(
    () => buildQueryParams(category, dateRange, startDate, endDate),
    [category, dateRange, startDate, endDate]
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [expRes, sumRes, sumMonthRes, budRes] = await Promise.all([
        fetch(apiUrl(`/api/expenses?${queryString}`)),
        fetch(apiUrl(`/api/summary?${queryString}`)),
        fetch(apiUrl("/api/summary?dateRange=this-month")),
        fetch(apiUrl("/api/budgets")),
      ]);

      if (!expRes.ok || !sumRes.ok) {
        throw new Error("Failed to load data");
      }

      const [expData, sumData, sumMonthData, budData] = await Promise.all([
        expRes.json(),
        sumRes.json(),
        sumMonthRes.json(),
        budRes.ok ? budRes.json() : [],
      ]);

      setExpenses(expData);
      setSummary(sumData);
      setMonthSummary(sumMonthData);
      setBudgets(budData);
    } catch {
      setError("Unable to load expenses. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (data: ExpenseFormValues) => {
    setIsSubmitting(true);
    try {
      const url = editingExpense
        ? apiUrl(`/api/expenses/${editingExpense.id}`)
        : apiUrl("/api/expenses");
      const method = editingExpense ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save");
      }

      toast.success(editingExpense ? "Expense updated" : "Expense added");
      setEditingExpense(undefined);
      await fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save expense");
      throw e;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl(`/api/expenses/${deleteTarget.id}`), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Expense deleted");
      setDeleteOpen(false);
      setDeleteTarget(null);
      await fetchData();
    } catch {
      toast.error("Failed to delete expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAdd = () => {
    setEditingExpense(undefined);
    setDialogOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-950">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Expense Tracker
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage and analyze your spending
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <BudgetSettings budgets={budgets} onRefresh={fetchData} />
            <Button className="gap-2 bg-blue-100 text-blue-950 hover:bg-blue-200" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-6 px-4 py-6">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
            <Button
              variant="link"
              className="ml-2 h-auto p-0 text-destructive"
              onClick={fetchData}
            >
              Retry
            </Button>
          </div>
        )}

        <SummaryCards summary={monthSummary} isLoading={isLoading} />

        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryPieChart summary={summary} isLoading={isLoading} />
          <MonthlyBarChart />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <ExpenseFilters
              category={category}
              dateRange={dateRange}
              startDate={startDate}
              endDate={endDate}
              onCategoryChange={setCategory}
              onDateRangeChange={setDateRange}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onExportCSV={() => {
                exportExpensesToCSV(expenses);
                toast.success("CSV exported successfully");
              }}
              expenseCount={expenses.length}
            />

            <div>
              <h2 className="mb-4 text-lg font-semibold">
                Expenses
                {!isLoading && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({expenses.length})
                  </span>
                )}
              </h2>

              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : expenses.length === 0 && category === "all" && dateRange === "all" ? (
                <EmptyState onAddClick={openAdd} />
              ) : expenses.length === 0 ? (
                <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                  No expenses match your filters.
                </div>
              ) : (
                <ExpenseList
                  expenses={expenses}
                  budgets={budgets}
                  categoryTotals={summary?.categoryTotals ?? {}}
                  onEdit={openEdit}
                  onDelete={(e) => {
                    setDeleteTarget(e);
                    setDeleteOpen(true);
                  }}
                />
              )}
            </div>
          </div>

          <CategoryBreakdown
            summary={summary}
            budgets={budgets}
            isLoading={isLoading}
          />
        </div>
      </main>

      <ExpenseDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingExpense(undefined);
        }}
        expense={editingExpense}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />

      <DeleteExpenseDialog
        expense={deleteTarget}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        isLoading={isSubmitting}
      />
    </div>
  );
}
