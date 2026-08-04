import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  INVENTORY_STOCK_STATUS_LABELS,
  type InventoryStockStatus,
} from "@/modules/inventory/constants/inventory-status";

interface InventoryStockStatusBadgeProps {
  status: InventoryStockStatus;
  className?: string;
}

const STATUS_VARIANT: Record<
  InventoryStockStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  in_stock: "default",
  low_stock: "outline",
  out_of_stock: "destructive",
  reserved: "secondary",
  damaged: "destructive",
  expired: "destructive",
};

export function InventoryStockStatusBadge({ status, className }: InventoryStockStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn("font-normal", className)}>
      {INVENTORY_STOCK_STATUS_LABELS[status]}
    </Badge>
  );
}
