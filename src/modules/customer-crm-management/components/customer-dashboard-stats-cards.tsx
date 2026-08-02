"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { CustomerDashboardStats } from "@/modules/customer-crm-management/types/customer-crm-types";

interface CustomerDashboardStatsCardsProps {
  stats: CustomerDashboardStats;
}

export function CustomerDashboardStatsCards({ stats }: CustomerDashboardStatsCardsProps) {
  const cards = [
    { label: "Total customers", value: stats.totalCustomers },
    { label: "Active customers", value: stats.activeCustomers },
    { label: "New this month", value: stats.newCustomersThisMonth },
    { label: "Lifetime spend", value: `£${stats.totalLifetimeSpend.toFixed(2)}` },
    { label: "Avg order value", value: `£${stats.averageOrderValue.toFixed(2)}` },
    { label: "Loyalty members", value: stats.loyaltyMembers },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label} className="rounded-xl shadow-sm">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">{card.label}</p>
            <p className="text-2xl font-semibold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
