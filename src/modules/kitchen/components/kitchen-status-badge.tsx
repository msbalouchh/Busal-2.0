import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  KITCHEN_STATUS_LABELS,
  type KitchenStatus,
} from "@/modules/kitchen/constants/kitchen-status";

interface KitchenStatusBadgeProps {
  status: KitchenStatus;
  className?: string;
}

const STATUS_VARIANT: Record<KitchenStatus, "default" | "secondary" | "outline" | "destructive"> = {
  queued: "outline",
  accepted: "secondary",
  preparing: "default",
  ready: "default",
  served: "secondary",
  delayed: "destructive",
  cancelled: "destructive",
};

export function KitchenStatusBadge({ status, className }: KitchenStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn("font-normal", className)}>
      {KITCHEN_STATUS_LABELS[status]}
    </Badge>
  );
}
