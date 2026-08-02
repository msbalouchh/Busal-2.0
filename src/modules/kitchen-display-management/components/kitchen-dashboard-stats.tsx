import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KitchenDashboardStats } from "@/modules/kitchen-display-management/types/kitchen-display-types";

interface KitchenDashboardStatsCardsProps {
  stats: KitchenDashboardStats;
}

export function KitchenDashboardStatsCards({ stats }: KitchenDashboardStatsCardsProps) {
  const cards = [
    { label: "New", value: stats.newCount },
    { label: "Accepted", value: stats.acceptedCount },
    { label: "Preparing", value: stats.preparingCount },
    { label: "Ready", value: stats.readyCount },
    { label: "Priority", value: stats.priorityCount },
    { label: "Served today", value: stats.servedToday },
    { label: "Avg prep (min)", value: stats.averagePrepMinutes },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
      {cards.map((card) => (
        <Card key={card.label} className="rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
