# Mini Expense Tracker

A full-stack expense tracking application built with **Next.js 15+ App Router**, **Prisma ORM**, **SQLite**, **Tailwind CSS**, **shadcn/ui**, **Recharts**, and **Zod** validation. Track daily spending, visualize trends, set category budgets, and export data to CSV.

## Project Overview

This application provides a professional dashboard to manage personal expenses with:

- Full CRUD for expenses with validation and confirmation dialogs
- Dashboard summary (monthly spend, category totals, highest expense, count)
- Filters by category and date range (This Month, Last Month, Custom)
- Pie chart (by category) and bar chart (monthly spending)
- Indian Rupee (₹) formatting (`₹1,23,456.00`)
- Category budget limits with visual over-budget warnings
- CSV export of filtered expenses
- Toast notifications, loading skeletons, and empty states

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js App Router, React, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes |
| Database | SQLite + Prisma ORM (v6) |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Notifications | Sonner |

## Folder Structure

```
expense-tracker/
├── app/
│   ├── api/
│   │   ├── expenses/          # GET, POST
│   │   ├── expenses/[id]/     # PUT, DELETE
│   │   ├── summary/           # Dashboard summary
│   │   ├── budgets/           # Budget CRUD
│   │   └── analytics/monthly/ # Bar chart data
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── charts/                # Recharts components
│   ├── dashboard/             # Dashboard layout & filters
│   ├── expense/               # Expense forms & list
│   └── ui/                    # shadcn/ui primitives
├── lib/
│   ├── currency.ts            # INR formatting
│   ├── csv-export.ts          # CSV download utility
│   ├── date-filters.ts        # Date range helpers
│   ├── prisma.ts              # Prisma client singleton
│   ├── utils.ts               # cn() utility
│   └── validations.ts         # Zod schemas
├── prisma/
│   └── schema.prisma          # Expense & Budget models
├── types/
│   └── index.ts               # Shared TypeScript types
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+ (LTS 20 or 22 recommended)
- npm

> **"Failed to create expense" / database errors:** Stop the dev server (`Ctrl+C`), then run `npm run fix:db` and start again with `npm run dev`. This rebuilds SQLite for your current Node.js version. Use the same Node version for `npm install` and `npm run dev` (check with `node -v`).

### Installation

```bash
cd expense-tracker
npm install
```

### Environment Variables

Create a `.env` file in the project root (or copy from `.env.example`):

```env
DATABASE_URL="file:./dev.db"
```

### Database Setup

```bash
npm run db:push
```

This creates the SQLite database and applies the Prisma schema.

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

## API Documentation

### Expenses

#### `GET /api/expenses`

Returns all expenses sorted by date (newest first).

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `category` | string | Filter by category or omit/`all` |
| `dateRange` | string | `this-month`, `last-month`, `custom`, `all` |
| `startDate` | string | ISO date (required for `custom`) |
| `endDate` | string | ISO date (required for `custom`) |

#### `POST /api/expenses`

Create a new expense.

**Body:**

```json
{
  "amount": 500,
  "category": "Food",
  "date": "2026-06-04",
  "note": "Lunch"
}
```

#### `PUT /api/expenses/[id]`

Update an existing expense. Same body as POST.

#### `DELETE /api/expenses/[id]`

Delete an expense by ID.

### Summary

#### `GET /api/summary`

Returns dashboard summary statistics.

**Response:**

```json
{
  "totalSpent": 12500,
  "highestExpense": 3500,
  "totalExpenses": 8,
  "categoryTotals": {
    "Food": 3200,
    "Transport": 1500
  }
}
```

Supports the same query parameters as `GET /api/expenses` for filtered summaries.

### Budgets

#### `GET /api/budgets`

List all category budgets.

#### `POST /api/budgets`

Create or update a budget.

```json
{
  "category": "Food",
  "limitAmount": 5000
}
```

#### `DELETE /api/budgets?category=Food`

Remove a budget for a category.

### Analytics

#### `GET /api/analytics/monthly`

Returns last 6 months of spending for the bar chart.

## Expense Categories

- Food
- Transport
- Bills
- Entertainment
- Shopping
- Healthcare
- Other

## Validation Rules

- **Amount**: Must be greater than 0
- **Category**: Required, must be one of the predefined categories
- **Date**: Required, cannot be in the future
- **Note**: Optional

## Deployment

### Vercel

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Set `DATABASE_URL` (use a persistent volume or switch to PostgreSQL for production).
4. Add build command: `npm run build`

> **Note:** SQLite file storage is suitable for local/demo use. For production, consider PostgreSQL with a hosted provider (Neon, Supabase, etc.) and update `datasource` in `prisma/schema.prisma`.

### Docker (optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npx prisma db push
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Future Improvements

- User authentication (NextAuth.js)
- Multi-currency support
- Recurring expenses
- Receipt image uploads
- Email/weekly spending reports
- PostgreSQL migration for production
- PWA offline support
- Dark/light theme toggle
- Shared household budgets

## License

MIT
