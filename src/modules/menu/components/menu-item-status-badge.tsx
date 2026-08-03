import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MenuItemStatus } from "@/modules/menu/constants/menu-status";

interface MenuItemStatusBadgeProps {
  status: MenuItemStatus;
  className?: string;
}

const STATUS_LABEL: Record<MenuItemStatus, string> = {
  draft: "Draft",
  active: "Active",
  hidden: "Hidden",
  archived: "Archived",
  seasonal: "Seasonal",
};

const STATUS_VARIANT: Record<MenuItemStatus, "default" | "secondary" | "outline" | "destructive"> =
  {
    draft: "outline",
    active: "default",
    hidden: "secondary",
    archived: "destructive",
    seasonal: "secondary",
  };

export function MenuItemStatusBadge({ status, className }: MenuItemStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn("font-normal", className)}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
