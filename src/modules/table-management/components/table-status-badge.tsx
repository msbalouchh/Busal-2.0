import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TableStatus } from "@/modules/table-management/constants/table-status";

interface TableStatusBadgeProps {
  status: TableStatus;
  className?: string;
}

const STATUS_LABEL: Record<TableStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  occupied: "Occupied",
  cleaning: "Cleaning",
  out_of_service: "Out of Service",
  blocked: "Blocked",
};

const STATUS_VARIANT: Record<TableStatus, "default" | "secondary" | "outline" | "destructive"> = {
  available: "default",
  reserved: "secondary",
  occupied: "outline",
  cleaning: "secondary",
  out_of_service: "destructive",
  blocked: "destructive",
};

export function TableStatusBadge({ status, className }: TableStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn("font-normal", className)}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
