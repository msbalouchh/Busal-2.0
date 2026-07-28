import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QRMenuStats } from "@/modules/qr-menu/lib/qr-menu-utils";

interface QRMenuOverviewProps {
  stats: QRMenuStats;
}

export function QRMenuOverview({ stats }: QRMenuOverviewProps) {
  const items = [
    { label: "Total QR Codes", value: stats.total },
    { label: "Active", value: stats.active },
    { label: "Inactive", value: stats.inactive },
    { label: "Assigned to Tables", value: stats.assignedToTables },
    { label: "Total Scans", value: stats.totalScans },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
