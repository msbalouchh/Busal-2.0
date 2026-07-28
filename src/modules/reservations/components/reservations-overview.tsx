import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReservationStats } from "@/modules/reservations/lib/reservation-utils";

interface ReservationsOverviewProps {
  stats: ReservationStats;
}

export function ReservationsOverview({ stats }: ReservationsOverviewProps) {
  const items = [
    { label: "Total Reservations", value: stats.total },
    { label: "Today's Reservations", value: stats.today },
    { label: "Pending", value: stats.pending },
    { label: "Confirmed", value: stats.confirmed },
    { label: "Completed", value: stats.completed },
    { label: "Cancelled", value: stats.cancelled },
    { label: "No Show", value: stats.noShow },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
