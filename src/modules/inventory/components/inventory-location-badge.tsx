import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InventoryLocationType } from "@/modules/inventory/constants/inventory-status";

interface InventoryLocationBadgeProps {
  locationType: InventoryLocationType;
  isWarehouse?: boolean;
  className?: string;
}

const LOCATION_LABELS: Record<InventoryLocationType, string> = {
  branch: "Branch",
  warehouse: "Warehouse",
  cold_storage: "Cold Storage",
  dry_storage: "Dry Storage",
  bar: "Bar",
  kitchen: "Kitchen",
};

export function InventoryLocationBadge({
  locationType,
  isWarehouse,
  className,
}: InventoryLocationBadgeProps) {
  const label = isWarehouse ? "Warehouse" : LOCATION_LABELS[locationType];

  return (
    <Badge variant="outline" className={cn("font-normal", className)}>
      {label}
    </Badge>
  );
}
