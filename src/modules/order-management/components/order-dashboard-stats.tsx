import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrderDashboardStats } from "@/modules/order-management/types/order-management-types";

interface OrderDashboardStatsCardsProps {
  stats: OrderDashboardStats;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "GBP" }).format(value);
}

export function OrderDashboardStatsCards({ stats }: OrderDashboardStatsCardsProps) {
  const cards = [
    { label: "Today", value: String(stats.totalToday) },
    { label: "Pending", value: String(stats.pendingToday) },
    { label: "Preparing", value: String(stats.preparingToday) },
    { label: "Ready", value: String(stats.readyToday) },
    { label: "Completed", value: String(stats.completedToday) },
    { label: "Unpaid", value: String(stats.unpaidToday) },
    { label: "Revenue", value: formatCurrency(stats.revenueToday) },
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
