import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BILLING_CYCLE_LABELS,
  type BillingCycle,
} from "@/modules/billing/constants/billing-status";

interface BillingCycleBadgeProps {
  cycle: BillingCycle;
  className?: string;
}

export function BillingCycleBadge({ cycle, className }: BillingCycleBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-normal", className)}>
      {BILLING_CYCLE_LABELS[cycle]}
    </Badge>
  );
}
