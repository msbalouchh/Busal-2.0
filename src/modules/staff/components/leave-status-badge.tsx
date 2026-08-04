import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LEAVE_STATUS_LABELS, type LeaveStatus } from "@/modules/staff/constants/staff-status";

interface LeaveStatusBadgeProps {
  status: LeaveStatus;
  className?: string;
}

const STATUS_VARIANT: Record<LeaveStatus, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
  cancelled: "secondary",
};

export function LeaveStatusBadge({ status, className }: LeaveStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn("font-normal", className)}>
      {LEAVE_STATUS_LABELS[status]}
    </Badge>
  );
}
