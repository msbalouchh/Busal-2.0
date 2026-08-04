import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  KITCHEN_PRIORITY_LABELS,
  type KitchenPriority,
} from "@/modules/kitchen/constants/kitchen-status";

interface KitchenPriorityBadgeProps {
  priority: KitchenPriority;
  className?: string;
}

const PRIORITY_VARIANT: Record<
  KitchenPriority,
  "default" | "secondary" | "outline" | "destructive"
> = {
  low: "outline",
  normal: "secondary",
  high: "default",
  urgent: "destructive",
  vip: "default",
};

export function KitchenPriorityBadge({ priority, className }: KitchenPriorityBadgeProps) {
  return (
    <Badge variant={PRIORITY_VARIANT[priority]} className={cn("font-normal", className)}>
      {KITCHEN_PRIORITY_LABELS[priority]}
    </Badge>
  );
}
