import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TableStats } from "@/modules/tables/lib/table-utils";

interface TablesOverviewProps {
  stats: TableStats;
}

export function TablesOverview({ stats }: TablesOverviewProps) {
  const items = [
    { label: "Total Tables", value: stats.total },
    { label: "Available", value: stats.available },
    { label: "Reserved", value: stats.reserved },
    { label: "Occupied", value: stats.occupied },
    { label: "Cleaning", value: stats.cleaning },
    { label: "Out of Service", value: stats.outOfService },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
