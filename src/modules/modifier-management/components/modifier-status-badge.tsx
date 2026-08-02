import type { ModifierGroupStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<ModifierGroupStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};

const STATUS_VARIANTS: Record<
  ModifierGroupStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  ACTIVE: "default",
  INACTIVE: "outline",
  ARCHIVED: "destructive",
};

interface ModifierStatusBadgeProps {
  status: ModifierGroupStatus;
  isRequired?: boolean;
  className?: string;
}

export function ModifierStatusBadge({ status, isRequired, className }: ModifierStatusBadgeProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Badge variant={STATUS_VARIANTS[status]} aria-label={`Status: ${STATUS_LABELS[status]}`}>
        {STATUS_LABELS[status]}
      </Badge>
      {isRequired ? (
        <Badge variant="secondary" aria-label="Required modifier group">
          Required
        </Badge>
      ) : null}
    </div>
  );
}
