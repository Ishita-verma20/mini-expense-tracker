"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  budgetFormSchema,
  type BudgetFormValues,
} from "@/lib/validations";
import { formatINR } from "@/lib/currency";
import { apiUrl } from "@/lib/api";
import { EXPENSE_CATEGORIES, type Budget } from "@/types";

interface BudgetSettingsProps {
  budgets: Budget[];
  onRefresh: () => void;
}

export function BudgetSettings({ budgets, onRefresh }: BudgetSettingsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
  });

  const category = watch("category");

  const onSubmit = async (data: BudgetFormValues) => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/budgets"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save budget");
      toast.success(`Budget set for ${data.category}`);
      reset();
      onRefresh();
    } catch {
      toast.error("Failed to save budget");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat: string) => {
    try {
      const res = await fetch(apiUrl(`/api/budgets?category=${encodeURIComponent(cat)}`), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Budget removed");
      onRefresh();
    } catch {
      toast.error("Failed to remove budget");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Budgets
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Category Budget Limits</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) =>
                setValue("category", v as BudgetFormValues["category"], {
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
            <Label htmlFor="limitAmount">Monthly limit (₹)</Label>
            <Input
              id="limitAmount"
              type="number"
              step="0.01"
              {...register("limitAmount", { valueAsNumber: true })}
            />
            {errors.limitAmount && (
              <p className="text-sm text-destructive">
                {errors.limitAmount.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Set Budget"}
          </Button>
        </form>

        {budgets.length > 0 && (
          <div className="mt-4 space-y-2 border-t pt-4">
            <p className="text-sm font-medium">Active budgets</p>
            {budgets.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  {b.category}: {formatINR(b.limitAmount)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleDelete(b.category)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
