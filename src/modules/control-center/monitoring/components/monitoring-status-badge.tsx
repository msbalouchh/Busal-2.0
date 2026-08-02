import { Badge } from "@/components/ui/badge";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  OPERATIONAL: "default",
  HEALTHY: "default",
  DEGRADED: "secondary",
  OUTAGE: "destructive",
  UNHEALTHY: "destructive",
  UNKNOWN: "outline",
  OPEN: "destructive",
  ACKNOWLEDGED: "secondary",
  RESOLVED: "default",
  DEBUG: "outline",
  INFO: "default",
  WARNING: "secondary",
  ERROR: "destructive",
  CRITICAL: "destructive",
};

export function monitoringStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  return STATUS_VARIANTS[status] ?? "outline";
}

interface MonitoringStatusBadgeProps {
  status: string;
  label?: string;
}

export function MonitoringStatusBadge({ status, label }: MonitoringStatusBadgeProps) {
  return (
    <Badge variant={monitoringStatusBadgeVariant(status)}>
      {label ?? status.replace(/_/g, " ")}
    </Badge>
  );
}

export function platformStatusBadge(status: string) {
  return <MonitoringStatusBadge status={status} label={status.replace(/_/g, " ")} />;
}
