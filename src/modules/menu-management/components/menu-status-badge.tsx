import type { MenuStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<MenuStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};

const STATUS_VARIANTS: Record<MenuStatus, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  ACTIVE: "default",
  INACTIVE: "outline",
  ARCHIVED: "destructive",
};

interface MenuStatusBadgeProps {
  status: MenuStatus;
  isDefault?: boolean;
  className?: string;
}

export function MenuStatusBadge({ status, isDefault, className }: MenuStatusBadgeProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Badge variant={STATUS_VARIANTS[status]} aria-label={`Status: ${STATUS_LABELS[status]}`}>
        {STATUS_LABELS[status]}
      </Badge>
      {isDefault ? (
        <Badge variant="secondary" aria-label="Default menu">
          Default
        </Badge>
      ) : null}
    </div>
  );
}
