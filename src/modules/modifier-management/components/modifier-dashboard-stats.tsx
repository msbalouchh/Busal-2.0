import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ModifierDashboardStats } from "@/modules/modifier-management/types/modifier-management-types";

interface ModifierDashboardStatsProps {
  stats: ModifierDashboardStats;
}

export function ModifierDashboardStatsCards({ stats }: ModifierDashboardStatsProps) {
  const cards = [
    { label: "Total groups", value: stats.total },
    { label: "Active", value: stats.active },
    { label: "Inactive", value: stats.inactive },
    { label: "Total options", value: stats.totalOptions },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
