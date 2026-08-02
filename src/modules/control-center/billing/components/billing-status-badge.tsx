import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BillingStatusBadgeProps {
  label: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export function BillingStatusBadge({
  label,
  variant = "outline",
  className,
}: BillingStatusBadgeProps) {
  return (
    <Badge variant={variant} className={cn("uppercase", className)}>
      {label}
    </Badge>
  );
}

export function billingPaymentBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status.toUpperCase()) {
    case "PAID":
      return "secondary";
    case "FAILED":
      return "destructive";
    case "PENDING":
      return "default";
    default:
      return "outline";
  }
}
