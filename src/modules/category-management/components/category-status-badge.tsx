import type { CategoryStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<CategoryStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};

const STATUS_VARIANTS: Record<CategoryStatus, "default" | "secondary" | "outline" | "destructive"> =
  {
    ACTIVE: "default",
    INACTIVE: "outline",
    ARCHIVED: "destructive",
  };

interface CategoryStatusBadgeProps {
  status: CategoryStatus;
  isFeatured?: boolean;
  className?: string;
}

export function CategoryStatusBadge({ status, isFeatured, className }: CategoryStatusBadgeProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Badge variant={STATUS_VARIANTS[status]} aria-label={`Status: ${STATUS_LABELS[status]}`}>
        {STATUS_LABELS[status]}
      </Badge>
      {isFeatured ? (
        <Badge variant="secondary" aria-label="Featured category">
          Featured
        </Badge>
      ) : null}
    </div>
  );
}
