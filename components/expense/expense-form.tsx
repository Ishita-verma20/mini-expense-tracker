"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  expenseFormSchema,
  type ExpenseFormValues,
} from "@/lib/validations";
import { EXPENSE_CATEGORIES, type Expense } from "@/types";

interface ExpenseFormProps {
  defaultValues?: Partial<ExpenseFormValues>;
  expense?: Expense;
  onSubmit: (data: ExpenseFormValues) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ExpenseForm({
  defaultValues,
  expense,
  onSubmit,
  onCancel,
  isLoading,
}: ExpenseFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: expense?.amount ?? defaultValues?.amount ?? undefined,
      category: expense?.category ?? defaultValues?.category ?? undefined,
      date:
        expense?.date
          ? format(new Date(expense.date), "yyyy-MM-dd")
          : defaultValues?.date ?? format(new Date(), "yyyy-MM-dd"),
      note: expense?.note ?? defaultValues?.note ?? "",
    },
  });

  const category = watch("category");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (₹)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          {...register("amount", { valueAsNumber: true })}
        />
        {errors.amount && (
          <p className="text-sm text-destructive">{errors.amount.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={category}
          onValueChange={(v) =>
            setValue("category", v as ExpenseFormValues["category"], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-destructive">{errors.category.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" {...register("date")} />
        {errors.date && (
          <p className="text-sm text-destructive">{errors.date.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea
          id="note"
          placeholder="Add a note..."
          {...register("note")}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : expense ? "Update Expense" : "Add Expense"}
        </Button>
      </div>
    </form>
  );
}
