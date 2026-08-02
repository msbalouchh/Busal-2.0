import { Badge } from "@/components/ui/badge";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  OPEN: "destructive",
  WAITING_STAFF: "secondary",
  WAITING_CUSTOMER: "outline",
  AI_HANDLED: "secondary",
  CLOSED: "default",
  LOW: "outline",
  NORMAL: "default",
  HIGH: "secondary",
  URGENT: "destructive",
  RESOLVED: "default",
  DRAFT: "outline",
  PUBLISHED: "default",
  ARCHIVED: "secondary",
  OPERATIONAL: "default",
  DEGRADED: "secondary",
  OUTAGE: "destructive",
};

export function supportStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  return STATUS_VARIANTS[status] ?? "outline";
}

interface SupportStatusBadgeProps {
  status: string;
  label?: string;
}

export function SupportStatusBadge({ status, label }: SupportStatusBadgeProps) {
  return (
    <Badge variant={supportStatusBadgeVariant(status)}>{label ?? status.replace(/_/g, " ")}</Badge>
  );
}
