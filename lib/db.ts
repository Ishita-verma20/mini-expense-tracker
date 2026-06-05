import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Budget, Expense, ExpenseCategory } from "@/types";

// On serverless hosts (Vercel, AWS Lambda) cwd is read-only; only /tmp is writable.
// Data written there is ephemeral and not shared between invocations.
const DB_PATH =
  process.env.DB_FILE_PATH ??
  (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? "/tmp/db.json"
    : path.join(process.cwd(), "db.json"));

interface DbShape {
  expenses: Expense[];
  budgets: Budget[];
}

const empty: DbShape = { expenses: [], budgets: [] };

// Serialize writes so concurrent route handlers don't clobber the file.
let writeQueue: Promise<unknown> = Promise.resolve();

async function readDb(): Promise<DbShape> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<DbShape>;
    return {
      expenses: parsed.expenses ?? [],
      budgets: parsed.budgets ?? [],
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      await fs.writeFile(DB_PATH, JSON.stringify(empty, null, 2), "utf8");
      return { ...empty };
    }
    throw err;
  }
}

async function writeDb(data: DbShape): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(fn, fn);
  writeQueue = next.catch(() => undefined);
  return next;
}

export interface ExpenseQuery {
  category?: string;
  dateGte?: Date;
  dateLte?: Date;
}

function matchesExpense(expense: Expense, query: ExpenseQuery): boolean {
  if (query.category && expense.category !== query.category) return false;
  if (query.dateGte || query.dateLte) {
    const d = new Date(expense.date).getTime();
    if (query.dateGte && d < query.dateGte.getTime()) return false;
    if (query.dateLte && d > query.dateLte.getTime()) return false;
  }
  return true;
}

export async function listExpenses(query: ExpenseQuery = {}): Promise<Expense[]> {
  const db = await readDb();
  return db.expenses
    .filter((e) => matchesExpense(e, query))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getExpense(id: string): Promise<Expense | null> {
  const db = await readDb();
  return db.expenses.find((e) => e.id === id) ?? null;
}

export interface ExpenseInput {
  amount: number;
  category: ExpenseCategory;
  date: Date;
  note: string | null;
}

export function createExpense(input: ExpenseInput): Promise<Expense> {
  return enqueue(async () => {
    const db = await readDb();
    const expense: Expense = {
      id: randomUUID(),
      amount: input.amount,
      category: input.category,
      date: input.date.toISOString(),
      note: input.note,
      createdAt: new Date().toISOString(),
    };
    db.expenses.push(expense);
    await writeDb(db);
    return expense;
  });
}

export function updateExpense(
  id: string,
  input: ExpenseInput
): Promise<Expense | null> {
  return enqueue(async () => {
    const db = await readDb();
    const idx = db.expenses.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    const updated: Expense = {
      ...db.expenses[idx],
      amount: input.amount,
      category: input.category,
      date: input.date.toISOString(),
      note: input.note,
    };
    db.expenses[idx] = updated;
    await writeDb(db);
    return updated;
  });
}

export function deleteExpense(id: string): Promise<boolean> {
  return enqueue(async () => {
    const db = await readDb();
    const idx = db.expenses.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    db.expenses.splice(idx, 1);
    await writeDb(db);
    return true;
  });
}

export async function listBudgets(): Promise<Budget[]> {
  const db = await readDb();
  return [...db.budgets].sort((a, b) => a.category.localeCompare(b.category));
}

export function upsertBudget(input: {
  category: ExpenseCategory;
  limitAmount: number;
}): Promise<Budget> {
  return enqueue(async () => {
    const db = await readDb();
    const idx = db.budgets.findIndex((b) => b.category === input.category);
    if (idx === -1) {
      const budget: Budget = {
        id: randomUUID(),
        category: input.category,
        limitAmount: input.limitAmount,
      };
      db.budgets.push(budget);
      await writeDb(db);
      return budget;
    }
    const updated: Budget = { ...db.budgets[idx], limitAmount: input.limitAmount };
    db.budgets[idx] = updated;
    await writeDb(db);
    return updated;
  });
}

export function deleteBudgetByCategory(category: string): Promise<void> {
  return enqueue(async () => {
    const db = await readDb();
    db.budgets = db.budgets.filter((b) => b.category !== category);
    await writeDb(db);
  });
}
