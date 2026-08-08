import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ACCOUNT_TYPE_LABELS, type AccountType } from "@/modules/finance/constants/finance-status";

interface AccountTypeBadgeProps {
  accountType: AccountType;
  className?: string;
}

const TYPE_VARIANT: Record<AccountType, "default" | "secondary" | "outline" | "destructive"> = {
  asset: "default",
  liability: "outline",
  equity: "secondary",
  revenue: "default",
  expense: "destructive",
  cogs: "destructive",
};

export function AccountTypeBadge({ accountType, className }: AccountTypeBadgeProps) {
  return (
    <Badge variant={TYPE_VARIANT[accountType]} className={cn("font-normal", className)}>
      {ACCOUNT_TYPE_LABELS[accountType]}
    </Badge>
  );
}
