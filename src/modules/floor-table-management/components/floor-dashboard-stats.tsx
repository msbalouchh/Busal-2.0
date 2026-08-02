import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FloorTableDashboardStats } from "@/modules/floor-table-management/types/floor-table-management-types";

interface FloorDashboardStatsProps {
  stats: FloorTableDashboardStats;
}

export function FloorDashboardStatsCards({ stats }: FloorDashboardStatsProps) {
  const cards = [
    { label: "Floors", value: stats.totalFloors },
    { label: "Active floors", value: stats.activeFloors },
    { label: "Total tables", value: stats.totalTables },
    { label: "Available tables", value: stats.availableTables },
    { label: "Occupied", value: stats.occupiedTables },
    { label: "Reserved", value: stats.reservedTables },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
