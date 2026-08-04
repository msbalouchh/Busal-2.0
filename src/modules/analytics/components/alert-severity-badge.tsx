import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ALERT_SEVERITY_LABELS,
  type AlertSeverity,
} from "@/modules/analytics/constants/analytics-status";

interface AlertSeverityBadgeProps {
  severity: AlertSeverity;
  className?: string;
}

const SEVERITY_VARIANT: Record<AlertSeverity, "default" | "secondary" | "outline" | "destructive"> =
  {
    info: "secondary",
    warning: "outline",
    critical: "destructive",
  };

export function AlertSeverityBadge({ severity, className }: AlertSeverityBadgeProps) {
  return (
    <Badge variant={SEVERITY_VARIANT[severity]} className={cn("font-normal", className)}>
      {ALERT_SEVERITY_LABELS[severity]}
    </Badge>
  );
}
