import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  KITCHEN_STATION_LABELS,
  type KitchenStationType,
} from "@/modules/kitchen/constants/kitchen-status";

interface KitchenStationBadgeProps {
  stationType: KitchenStationType;
  customLabel?: string | null;
  className?: string;
}

export function KitchenStationBadge({
  stationType,
  customLabel,
  className,
}: KitchenStationBadgeProps) {
  const label =
    stationType === "custom" && customLabel ? customLabel : KITCHEN_STATION_LABELS[stationType];

  return (
    <Badge variant="outline" className={cn("font-normal", className)}>
      {label}
    </Badge>
  );
}
