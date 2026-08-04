import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  INTEGRATION_STATUS_LABELS,
  type IntegrationStatus,
} from "@/modules/integrations/constants/integration-status";

interface IntegrationStatusBadgeProps {
  status: IntegrationStatus;
  className?: string;
}

const STATUS_VARIANT: Record<
  IntegrationStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "outline",
  pending: "secondary",
  connected: "default",
  disconnected: "outline",
  error: "destructive",
  suspended: "destructive",
};

export function IntegrationStatusBadge({ status, className }: IntegrationStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn("font-normal", className)}>
      {INTEGRATION_STATUS_LABELS[status]}
    </Badge>
  );
}
