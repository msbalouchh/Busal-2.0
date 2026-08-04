import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  SUBSCRIPTION_STATUS_LABELS,
  type SubscriptionStatus,
} from "@/modules/billing/constants/billing-status";

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus;
  className?: string;
}

const STATUS_VARIANT: Record<
  SubscriptionStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  trialing: "secondary",
  active: "default",
  past_due: "destructive",
  paused: "outline",
  cancelled: "destructive",
  expired: "destructive",
};

export function SubscriptionStatusBadge({ status, className }: SubscriptionStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn("font-normal", className)}>
      {SUBSCRIPTION_STATUS_LABELS[status]}
    </Badge>
  );
}
