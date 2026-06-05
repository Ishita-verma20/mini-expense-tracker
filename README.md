# Mini Expense Tracker

A full-stack expense tracking application built with **Next.js 15+ App Router**, a **JSON file datastore** (`db.json`), **Tailwind CSS**, **shadcn/ui**, **Recharts**, and **Zod** validation. Track daily spending, visualize trends, set category budgets, and export data to CSV.

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
| Database | JSON file (`db.json`) |
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
│   ├── db.ts                  # JSON file datastore
│   ├── utils.ts               # cn() utility
│   └── validations.ts         # Zod schemas
├── types/
│   └── index.ts               # Shared TypeScript types
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+ (LTS 20 or 22 recommended)
- npm

### Installation

```bash
cd expense-tracker
npm install
```

### Data Storage

All data is persisted to a `db.json` file at the project root. The file is created automatically the first time the API is hit. No setup or migrations required.

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
3. Add build command: `npm run build`

> **Note:** The JSON file store works for local/demo use. On serverless platforms (Vercel/Netlify) the filesystem is ephemeral, so the data will not persist between deploys or invocations. For production, swap `lib/db.ts` for a hosted database client.

### Docker (optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
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
- Hosted database for production
- PWA offline support
- Dark/light theme toggle
- Shared household budgets

## License

MIT
