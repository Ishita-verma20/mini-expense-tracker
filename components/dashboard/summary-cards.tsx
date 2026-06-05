"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/currency";
import { IndianRupee, TrendingUp, Hash, Layers } from "lucide-react";
import type { SummaryResponse } from "@/types";

interface SummaryCardsProps {
  summary: SummaryResponse | null;
  isLoading: boolean;
}

export function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
  const cards = [
    {
      title: "Spent This Month",
      value: summary ? formatINR(summary.totalSpent) : "—",
      icon: IndianRupee,
      color: "text-emerald-600",
    },
    {
      title: "Highest Expense",
      value: summary ? formatINR(summary.highestExpense) : "—",
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      title: "Total Expenses",
      value: summary?.totalExpenses?.toString() ?? "—",
      icon: Hash,
      color: "text-violet-600",
    },
    {
      title: "Categories Used",
      value: summary
        ? Object.values(summary.categoryTotals).filter((v) => v > 0).length.toString()
        : "—",
      icon: Layers,
      color: "text-orange-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
