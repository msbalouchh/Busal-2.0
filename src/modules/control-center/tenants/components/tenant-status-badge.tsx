import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TenantStatusBadgeProps {
  label: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export function TenantStatusBadge({
  label,
  variant = "outline",
  className,
}: TenantStatusBadgeProps) {
  return (
    <Badge variant={variant} className={cn("uppercase", className)}>
      {label}
    </Badge>
  );
}

export function tenantLifecycleBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ACTIVE":
      return "secondary";
    case "SUSPENDED":
      return "destructive";
    case "ARCHIVED":
    case "DELETED":
      return "outline";
    default:
      return "default";
  }
}

export function tenantHealthBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "HEALTHY":
      return "secondary";
    case "DEGRADED":
      return "default";
    case "CRITICAL":
      return "destructive";
    default:
      return "outline";
  }
}
