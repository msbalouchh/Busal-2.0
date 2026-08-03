import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RbacPermissionBadgeProps {
  label: string;
  granted?: boolean;
  className?: string;
}

export function RbacPermissionBadge({
  label,
  granted = false,
  className,
}: RbacPermissionBadgeProps) {
  return (
    <Badge
      variant={granted ? "default" : "outline"}
      className={cn("font-normal", className)}
      aria-label={granted ? `${label} granted` : `${label} denied`}
    >
      {label}
    </Badge>
  );
}
