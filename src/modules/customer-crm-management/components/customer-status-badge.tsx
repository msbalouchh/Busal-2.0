import type { CustomerStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { CUSTOMER_STATUS_LABELS } from "@/modules/customer-crm-management/lib/customer-crm-validation";

const STATUS_VARIANT: Record<CustomerStatus, "default" | "secondary" | "destructive" | "outline"> =
  {
    ACTIVE: "default",
    INACTIVE: "secondary",
    BLOCKED: "destructive",
    ARCHIVED: "outline",
  };

interface CustomerStatusBadgeProps {
  status: CustomerStatus;
}

export function CustomerStatusBadge({ status }: CustomerStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANT[status]}>{CUSTOMER_STATUS_LABELS[status]}</Badge>;
}
