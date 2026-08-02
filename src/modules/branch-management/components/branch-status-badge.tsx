import type { BranchStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<BranchStatus, string> = {
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

interface BranchStatusBadgeProps {
  status: BranchStatus;
  isPrimary?: boolean;
  className?: string;
}

export function BranchStatusBadge({ status, isPrimary, className }: BranchStatusBadgeProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Badge
        variant={status === "ACTIVE" ? "default" : "outline"}
        aria-label={`Status: ${STATUS_LABELS[status]}`}
      >
        {STATUS_LABELS[status]}
      </Badge>
      {isPrimary ? (
        <Badge variant="secondary" aria-label="Primary branch">
          Primary
        </Badge>
      ) : null}
    </div>
  );
}
