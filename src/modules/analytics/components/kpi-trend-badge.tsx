import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { KPI_TREND_LABELS, type KpiTrend } from "@/modules/analytics/constants/analytics-status";

interface KpiTrendBadgeProps {
  trend: KpiTrend;
  changePercent?: number;
  className?: string;
}

const TREND_VARIANT: Record<KpiTrend, "default" | "secondary" | "outline" | "destructive"> = {
  up: "default",
  down: "destructive",
  flat: "secondary",
};

export function KpiTrendBadge({ trend, changePercent, className }: KpiTrendBadgeProps) {
  const label =
    changePercent !== undefined
      ? `${KPI_TREND_LABELS[trend]} ${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(1)}%`
      : KPI_TREND_LABELS[trend];

  return (
    <Badge variant={TREND_VARIANT[trend]} className={cn("font-normal", className)}>
      {label}
    </Badge>
  );
}
