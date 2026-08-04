import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DELIVERY_STATUS_LABELS,
  type DeliveryStatus,
} from "@/modules/notifications/constants/notification-status";

interface DeliveryStatusBadgeProps {
  status: DeliveryStatus;
  className?: string;
}

const STATUS_VARIANT: Record<DeliveryStatus, "default" | "secondary" | "outline" | "destructive"> =
  {
    pending: "outline",
    in_progress: "secondary",
    delivered: "default",
    failed: "destructive",
    bounced: "destructive",
    retrying: "secondary",
  };

export function DeliveryStatusBadge({ status, className }: DeliveryStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn("font-normal", className)}>
      {DELIVERY_STATUS_LABELS[status]}
    </Badge>
  );
}
