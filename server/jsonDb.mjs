import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "db.json");

async function load() {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const data = JSON.parse(raw);
    return { expenses: data.expenses ?? [], budgets: data.budgets ?? [] };
  } catch (err) {
    if (err.code === "ENOENT") {
      const init = { expenses: [], budgets: [] };
      await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
      await fs.writeFile(DB_PATH, JSON.stringify(init, null, 2));
      return init;
    }
    throw err;
  }
}

async function save(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

function matchesWhereExpense(expense, where) {
  if (!where) return true;
  if (where.category && expense.category !== where.category) return false;
  if (where.date) {
    const gte = where.date.gte ? new Date(where.date.gte) : null;
    const lte = where.date.lte ? new Date(where.date.lte) : null;
    const ed = new Date(expense.date);
    if (gte && ed < gte) return false;
    if (lte && ed > lte) return false;
  }
  return true;
}

const expense = {
  async findMany(opts = {}) {
    const { where, orderBy } = opts;
    const db = await load();
    let items = db.expenses.filter((e) => matchesWhereExpense(e, where));
    if (orderBy && orderBy.date === "desc") {
      items = items.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return items;
  },

  async findUnique({ where }) {
    const db = await load();
    return db.expenses.find((e) => e.id === where.id) || null;
  },

  async create({ data }) {
    const db = await load();
    const record = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...data,
      date: data.date instanceof Date ? data.date.toISOString() : data.date,
    };
    db.expenses.push(record);
    await save(db);
    return record;
  },

  async update({ where, data }) {
    const db = await load();
    const idx = db.expenses.findIndex((e) => e.id === where.id);
    if (idx === -1) throw new Error("Not found");
    const next = { ...db.expenses[idx], ...data };
    if (data.date instanceof Date) next.date = data.date.toISOString();
    db.expenses[idx] = next;
    await save(db);
    return db.expenses[idx];
  },

  async delete({ where }) {
    const db = await load();
    const idx = db.expenses.findIndex((e) => e.id === where.id);
    if (idx === -1) throw new Error("Not found");
    const removed = db.expenses.splice(idx, 1)[0];
    await save(db);
    return removed;
  },
};

const budget = {
  async findMany(opts = {}) {
    const db = await load();
    const items = [...db.budgets];
    if (opts.orderBy && opts.orderBy.category === "asc") {
      items.sort((a, b) => a.category.localeCompare(b.category));
    }
    return items;
  },

  async upsert({ where, create, update }) {
    const db = await load();
    const idx = db.budgets.findIndex((b) => b.category === where.category);
    if (idx === -1) {
      const record = { id: randomUUID(), ...create };
      db.budgets.push(record);
      await save(db);
      return record;
    }
    db.budgets[idx] = { ...db.budgets[idx], ...update };
    await save(db);
    return db.budgets[idx];
  },

  async deleteMany({ where }) {
    const db = await load();
    const before = db.budgets.length;
    if (where && where.category) {
      db.budgets = db.budgets.filter((b) => b.category !== where.category);
    } else {
      db.budgets = [];
    }
    await save(db);
    return { count: before - db.budgets.length };
  },
};

export default { expense, budget };
