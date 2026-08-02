import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MenuDashboardStats } from "@/modules/menu-management/types/menu-management-types";

interface MenuDashboardStatsProps {
  stats: MenuDashboardStats;
}

export function MenuDashboardStatsCards({ stats }: MenuDashboardStatsProps) {
  const cards = [
    { label: "Total menus", value: stats.total },
    { label: "Active", value: stats.active },
    { label: "Draft", value: stats.draft },
    { label: "Archived", value: stats.archived },
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
