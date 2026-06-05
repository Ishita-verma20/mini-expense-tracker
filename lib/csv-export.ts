import type { Expense } from "@/types";
import { formatINR } from "@/lib/currency";

export function exportExpensesToCSV(expenses: Expense[], filename = "expenses.csv") {
  if (expenses.length === 0) return;

  const headers = ["ID", "Amount", "Category", "Date", "Note", "Created At"];
  const rows = expenses.map((e) => [
    e.id,
    e.amount.toString(),
    e.category,
    new Date(e.date).toLocaleDateString("en-IN"),
    e.note ?? "",
    new Date(e.createdAt).toLocaleString("en-IN"),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function formatAmountForCSV(amount: number) {
  return formatINR(amount);
}
