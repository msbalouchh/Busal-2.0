import type { InventoryStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { INVENTORY_STATUS_LABELS } from "@/modules/inventory-supplier-management/lib/inventory-supplier-validation";

const VARIANT: Record<InventoryStatus, "default" | "secondary" | "outline"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  ARCHIVED: "outline",
};

export function InventoryStatusBadge({ status }: { status: InventoryStatus }) {
  return <Badge variant={VARIANT[status]}>{INVENTORY_STATUS_LABELS[status]}</Badge>;
}
