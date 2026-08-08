import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OperatorStatusBadgeProps {
  label: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export function OperatorStatusBadge({
  label,
  variant = "outline",
  className,
}: OperatorStatusBadgeProps) {
  return (
    <Badge variant={variant} className={cn("uppercase", className)}>
      {label}
    </Badge>
  );
}

export function operatorStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "suspended") return "destructive";
  if (status === "active") return "secondary";
  return "outline";
}

export function operatorRoleBadgeVariant(
  role: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (role === "PLATFORM_OWNER") return "default";
  if (role === "READ_ONLY") return "outline";
  return "secondary";
}
