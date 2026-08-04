import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  EMPLOYMENT_STATUS_LABELS,
  type EmploymentStatus,
} from "@/modules/staff/constants/staff-status";

interface EmploymentStatusBadgeProps {
  status: EmploymentStatus;
  className?: string;
}

const STATUS_VARIANT: Record<
  EmploymentStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  active: "default",
  inactive: "secondary",
  on_leave: "outline",
  suspended: "destructive",
  terminated: "destructive",
};

export function EmploymentStatusBadge({ status, className }: EmploymentStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn("font-normal", className)}>
      {EMPLOYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
