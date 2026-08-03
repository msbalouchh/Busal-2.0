import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CustomerStatus } from "@/modules/crm/constants/customer-status";

interface CustomerBadgeProps {
  status: CustomerStatus;
  className?: string;
}

const STATUS_VARIANT: Record<CustomerStatus, "default" | "secondary" | "outline" | "destructive"> =
  {
    active: "secondary",
    inactive: "outline",
    prospect: "outline",
    vip: "default",
    blocked: "destructive",
  };

export function CustomerBadge({ status, className }: CustomerBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn("font-normal capitalize", className)}>
      {status}
    </Badge>
  );
}
