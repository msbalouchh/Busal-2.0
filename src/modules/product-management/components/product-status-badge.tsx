import type { ProductStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<ProductStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};

const STATUS_VARIANTS: Record<ProductStatus, "default" | "secondary" | "outline" | "destructive"> =
  {
    ACTIVE: "default",
    INACTIVE: "outline",
    ARCHIVED: "destructive",
  };

interface ProductStatusBadgeProps {
  status: ProductStatus;
  isFeatured?: boolean;
  className?: string;
}

export function ProductStatusBadge({ status, isFeatured, className }: ProductStatusBadgeProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Badge variant={STATUS_VARIANTS[status]} aria-label={`Status: ${STATUS_LABELS[status]}`}>
        {STATUS_LABELS[status]}
      </Badge>
      {isFeatured ? (
        <Badge variant="secondary" aria-label="Featured product">
          Featured
        </Badge>
      ) : null}
    </div>
  );
}
