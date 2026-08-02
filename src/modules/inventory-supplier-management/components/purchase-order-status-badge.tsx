import type { PurchaseOrderStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/modules/inventory-supplier-management/lib/inventory-supplier-validation";

const VARIANT: Record<PurchaseOrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  SENT: "default",
  PARTIALLY_RECEIVED: "outline",
  RECEIVED: "default",
  CANCELLED: "destructive",
};

export function PurchaseOrderStatusBadge({ status }: { status: PurchaseOrderStatus }) {
  return <Badge variant={VARIANT[status]}>{PURCHASE_ORDER_STATUS_LABELS[status]}</Badge>;
}
