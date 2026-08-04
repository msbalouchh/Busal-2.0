import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PLAN_TYPE_LABELS, type PlanType } from "@/modules/billing/constants/billing-status";

interface PlanTypeBadgeProps {
  planType: PlanType;
  className?: string;
}

const PLAN_VARIANT: Record<PlanType, "default" | "secondary" | "outline" | "destructive"> = {
  free: "outline",
  starter: "secondary",
  professional: "default",
  business: "default",
  enterprise: "default",
  custom: "secondary",
};

export function PlanTypeBadge({ planType, className }: PlanTypeBadgeProps) {
  return (
    <Badge variant={PLAN_VARIANT[planType]} className={cn("font-normal", className)}>
      {PLAN_TYPE_LABELS[planType]}
    </Badge>
  );
}
