import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProductDashboardStats } from "@/modules/product-management/types/product-management-types";

interface ProductDashboardStatsProps {
  stats: ProductDashboardStats;
}

export function ProductDashboardStatsCards({ stats }: ProductDashboardStatsProps) {
  const cards = [
    { label: "Total products", value: stats.total },
    { label: "Active", value: stats.active },
    { label: "Inactive", value: stats.inactive },
    { label: "Featured", value: stats.featured },
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
