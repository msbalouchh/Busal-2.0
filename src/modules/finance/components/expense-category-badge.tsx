import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from "@/modules/finance/constants/finance-status";

interface ExpenseCategoryBadgeProps {
  category: ExpenseCategory;
  className?: string;
}

export function ExpenseCategoryBadge({ category, className }: ExpenseCategoryBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-normal", className)}>
      {EXPENSE_CATEGORY_LABELS[category]}
    </Badge>
  );
}
