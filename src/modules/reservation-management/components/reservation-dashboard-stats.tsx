import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReservationDashboardStats } from "@/modules/reservation-management/types/reservation-management-types";

interface ReservationDashboardStatsCardsProps {
  stats: ReservationDashboardStats;
}

export function ReservationDashboardStatsCards({ stats }: ReservationDashboardStatsCardsProps) {
  const cards = [
    { label: "Today", value: stats.totalToday },
    { label: "Pending", value: stats.pendingToday },
    { label: "Confirmed", value: stats.confirmedToday },
    { label: "Seated", value: stats.seatedToday },
    { label: "Completed", value: stats.completedToday },
    { label: "Upcoming (7d)", value: stats.upcomingWeek },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
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
