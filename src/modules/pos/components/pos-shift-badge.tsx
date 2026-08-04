import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { POS_SHIFT_STATUS_LABELS, type PosShiftStatus } from "@/modules/pos/constants/pos-status";

interface PosShiftBadgeProps {
  status: PosShiftStatus;
  className?: string;
}

const STATUS_VARIANT: Record<PosShiftStatus, "default" | "secondary" | "outline" | "destructive"> =
  {
    open: "default",
    closed: "secondary",
    reconciling: "outline",
  };

export function PosShiftBadge({ status, className }: PosShiftBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn("font-normal", className)}>
      {POS_SHIFT_STATUS_LABELS[status]}
    </Badge>
  );
}
