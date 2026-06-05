"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/expense/expense-form";
import type { Expense } from "@/types";
import type { ExpenseFormValues } from "@/lib/validations";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense;
  onSubmit: (data: ExpenseFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function ExpenseDialog({
  open,
  onOpenChange,
  expense,
  onSubmit,
  isLoading,
}: ExpenseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {expense ? "Edit Expense" : "Add New Expense"}
          </DialogTitle>
        </DialogHeader>
        <ExpenseForm
          key={expense?.id ?? "new"}
          expense={expense}
          onSubmit={async (data) => {
            await onSubmit(data);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
