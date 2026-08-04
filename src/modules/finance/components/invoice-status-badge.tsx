import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  INVOICE_STATUS_LABELS,
  type InvoiceStatus,
} from "@/modules/finance/constants/finance-status";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const STATUS_VARIANT: Record<InvoiceStatus, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  sent: "secondary",
  partially_paid: "outline",
  paid: "default",
  overdue: "destructive",
  void: "destructive",
  refunded: "secondary",
};

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn("font-normal", className)}>
      {INVOICE_STATUS_LABELS[status]}
    </Badge>
  );
}
