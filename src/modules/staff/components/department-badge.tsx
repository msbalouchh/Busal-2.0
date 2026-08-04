import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  STAFF_DEPARTMENT_LABELS,
  type StaffDepartment,
} from "@/modules/staff/constants/staff-status";

interface DepartmentBadgeProps {
  departmentType: StaffDepartment;
  customLabel?: string | null;
  className?: string;
}

export function DepartmentBadge({ departmentType, customLabel, className }: DepartmentBadgeProps) {
  const label =
    departmentType === "custom" && customLabel
      ? customLabel
      : STAFF_DEPARTMENT_LABELS[departmentType];

  return (
    <Badge variant="outline" className={cn("font-normal", className)}>
      {label}
    </Badge>
  );
}
