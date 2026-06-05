import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/types";

const categoryEnum = z.enum(EXPENSE_CATEGORIES);

export const expenseFormSchema = z.object({
  amount: z
    .number({ error: "Amount is required" })
    .positive("Amount must be greater than 0"),
  category: categoryEnum,
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

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export const expenseApiSchema = expenseFormSchema;

export const budgetFormSchema = z.object({
  category: categoryEnum,
  limitAmount: z
    .number({ error: "Limit is required" })
    .positive("Limit must be greater than 0"),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;
