import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { endOfDay, format, startOfMonth, subMonths } from "date-fns";

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Bills",
  "Entertainment",
  "Shopping",
  "Healthcare",
  "Other",
];

const expenseSchema = z.object({
  amount: z.number({ error: "Amount is required" }).positive("Amount must be greater than 0"),
  category: z.enum(EXPENSE_CATEGORIES),
  date: z
    .string()
    .min(1, "Date is required")
    .refine((val) => {
      const d = new Date(val);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return d <= today;
    }, "Date cannot be in the future"),
  note: z.string().optional(),
});

const budgetSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  limitAmount: z.number({ error: "Limit is required" }).positive("Limit must be greater than 0"),
});

function getDateRange(dateRange, startDate, endDate) {
  const now = new Date();

  if (dateRange === "last-month") {
    const start = startOfMonth(subMonths(now, 1));
    const end = endOfDay(new Date(start.getFullYear(), start.getMonth() + 1, 0));
    return { start, end };
  }

  if (dateRange === "custom" && startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  const start = startOfMonth(now);
  const end = endOfDay(now);
  return { start, end };
}

function getDateFilter(query) {
  const { dateRange, startDate, endDate } = query;
  if (!dateRange || dateRange === "this-month") {
    return getDateRange("this-month");
  }
  if (dateRange === "custom") {
    return getDateRange("custom", startDate, endDate);
  }
  return getDateRange(dateRange);
}

function buildWhere(query) {
  const where = {};
  if (query.category && query.category !== "all" && EXPENSE_CATEGORIES.includes(query.category)) {
    where.category = query.category;
  }

  const dateRange = getDateFilter(query);
  if (dateRange) {
    where.date = { gte: dateRange.start, lte: dateRange.end };
  }

  return where;
}

app.get("/api/expenses", async (req, res) => {
  try {
    const where = buildWhere(req.query);
    const expenses = await prisma.expense.findMany({ where, orderBy: { date: "desc" } });
    return res.json(expenses);
  } catch (error) {
    console.error("GET /api/expenses:", error);
    return res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

app.post("/api/expenses", async (req, res) => {
  try {
    const parsed = expenseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    }

    const { amount, category, date, note } = parsed.data;
    const expense = await prisma.expense.create({ data: { amount, category, date: new Date(date), note: note || null } });
    return res.status(201).json(expense);
  } catch (error) {
    console.error("POST /api/expenses:", error);
    return res.status(500).json({ error: "Failed to create expense" });
  }
});

app.put("/api/expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = expenseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    }

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const { amount, category, date, note } = parsed.data;
    const expense = await prisma.expense.update({ where: { id }, data: { amount, category, date: new Date(date), note: note || null } });
    return res.json(expense);
  } catch (error) {
    console.error("PUT /api/expenses/:id:", error);
    return res.status(500).json({ error: "Failed to update expense" });
  }
});

app.delete("/api/expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Expense not found" });
    }
    await prisma.expense.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/expenses/:id:", error);
    return res.status(500).json({ error: "Failed to delete expense" });
  }
});

app.get("/api/budgets", async (_req, res) => {
  try {
    const budgets = await prisma.budget.findMany({ orderBy: { category: "asc" } });
    return res.json(budgets);
  } catch (error) {
    console.error("GET /api/budgets:", error);
    return res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

app.post("/api/budgets", async (req, res) => {
  try {
    const parsed = budgetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    }

    const { category, limitAmount } = parsed.data;
    const budget = await prisma.budget.upsert({
      where: { category },
      create: { category, limitAmount },
      update: { limitAmount },
    });
    return res.status(201).json(budget);
  } catch (error) {
    console.error("POST /api/budgets:", error);
    return res.status(500).json({ error: "Failed to save budget" });
  }
});

app.delete("/api/budgets", async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ error: "Category is required" });
    }
    await prisma.budget.deleteMany({ where: { category: String(category) } });
    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/budgets:", error);
    return res.status(500).json({ error: "Failed to delete budget" });
  }
});

app.get("/api/summary", async (req, res) => {
  try {
    const where = buildWhere(req.query);
    const expenses = await prisma.expense.findMany({ where });

    const categoryTotals = EXPENSE_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {});
    let totalSpent = 0;
    let highestExpense = 0;

    expenses.forEach((expense) => {
      totalSpent += expense.amount;
      highestExpense = Math.max(highestExpense, expense.amount);
      categoryTotals[expense.category] = (categoryTotals[expense.category] ?? 0) + expense.amount;
    });

    return res.json({
      totalSpent,
      highestExpense,
      totalExpenses: expenses.length,
      categoryTotals,
    });
  } catch (error) {
    console.error("GET /api/summary:", error);
    return res.status(500).json({ error: "Failed to fetch summary" });
  }
});

app.get("/api/analytics/monthly", async (_req, res) => {
  try {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const end = endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
      months.push({ label: format(d, "MMM yyyy"), start, end });
    }

    const expenses = await prisma.expense.findMany({ where: { date: { gte: months[0].start } } });
    const monthlyData = months.map((month) => ({
      month: month.label,
      total: expenses
        .filter((expense) => expense.date >= month.start && expense.date <= month.end)
        .reduce((sum, expense) => sum + expense.amount, 0),
    }));

    return res.json(monthlyData);
  } catch (error) {
    console.error("GET /api/analytics/monthly:", error);
    return res.status(500).json({ error: "Failed to fetch monthly analytics" });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const port = process.env.PORT ? Number(process.env.PORT) : 10000;
app.listen(port, () => {
  console.log(`Render backend listening on port ${port}`);
});
