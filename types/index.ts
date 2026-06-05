export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Bills",
  "Entertainment",
  "Shopping",
  "Healthcare",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  note: string | null;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: ExpenseCategory;
  limitAmount: number;
}

export interface SummaryResponse {
  totalSpent: number;
  highestExpense: number;
  totalExpenses: number;
  categoryTotals: Record<string, number>;
}

export type DateRangePreset = "this-month" | "last-month" | "custom" | "all";

export interface ExpenseFilters {
  category?: ExpenseCategory | "all";
  dateRange?: DateRangePreset;
  startDate?: string;
  endDate?: string;
}

export interface MonthlySpending {
  month: string;
  total: number;
}
