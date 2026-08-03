import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ZoneType } from "@/modules/table-management/constants/table-status";

interface TableZoneBadgeProps {
  zoneType: ZoneType;
  className?: string;
}

const ZONE_LABEL: Record<ZoneType, string> = {
  main_dining: "Main Dining",
  outdoor: "Outdoor",
  vip: "VIP",
  private_room: "Private Room",
  waiting_area: "Waiting Area",
  bar: "Bar",
};

export function TableZoneBadge({ zoneType, className }: TableZoneBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-normal", className)}>
      {ZONE_LABEL[zoneType]}
    </Badge>
  );
}
