import { Receipt, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onAddClick: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-4">
        <Receipt className="h-10 w-10 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">No expenses yet</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Start tracking your spending by adding your first expense. Your
        dashboard and charts will update automatically.
      </p>
      <Button className="mt-6 gap-2" onClick={onAddClick}>
        <Plus className="h-4 w-4" />
        Add your first expense
      </Button>
    </div>
  );
}
