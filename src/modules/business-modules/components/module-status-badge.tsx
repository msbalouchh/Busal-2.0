import type { BusinessModuleStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<BusinessModuleStatus, string> = {
  AVAILABLE: "Available",
  INSTALLED: "Installed",
  ENABLED: "Enabled",
  DISABLED: "Disabled",
  DEPRECATED: "Deprecated",
};

const STATUS_VARIANTS: Record<
  BusinessModuleStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  AVAILABLE: "outline",
  INSTALLED: "secondary",
  ENABLED: "default",
  DISABLED: "outline",
  DEPRECATED: "destructive",
};

interface ModuleStatusBadgeProps {
  status: BusinessModuleStatus;
  isEnabled?: boolean;
  className?: string;
}

export function ModuleStatusBadge({ status, isEnabled, className }: ModuleStatusBadgeProps) {
  const label =
    status === "ENABLED" || (status === "INSTALLED" && isEnabled)
      ? "Enabled"
      : status === "DISABLED" || (status === "INSTALLED" && !isEnabled)
        ? "Installed"
        : STATUS_LABELS[status];

  const variant =
    status === "ENABLED" || isEnabled
      ? "default"
      : status === "DISABLED"
        ? "outline"
        : STATUS_VARIANTS[status];

  return (
    <Badge
      variant={variant}
      className={cn("font-normal", className)}
      aria-label={`Status: ${label}`}
    >
      {label}
    </Badge>
  );
}
