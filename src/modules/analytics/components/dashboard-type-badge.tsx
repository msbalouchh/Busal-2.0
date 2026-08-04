import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_TYPE_LABELS,
  type DashboardType,
} from "@/modules/analytics/constants/analytics-status";

interface DashboardTypeBadgeProps {
  dashboardType: DashboardType;
  className?: string;
}

const TYPE_VARIANT: Record<DashboardType, "default" | "secondary" | "outline" | "destructive"> = {
  executive: "default",
  operations: "secondary",
  kitchen: "outline",
  finance: "default",
  marketing: "secondary",
  inventory: "outline",
  staff: "outline",
  owner: "default",
  custom: "secondary",
};

export function DashboardTypeBadge({ dashboardType, className }: DashboardTypeBadgeProps) {
  return (
    <Badge variant={TYPE_VARIANT[dashboardType]} className={cn("font-normal", className)}>
      {DASHBOARD_TYPE_LABELS[dashboardType]}
    </Badge>
  );
}
