import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  INTEGRATION_CATEGORY_LABELS,
  type IntegrationCategory,
} from "@/modules/integrations/constants/integration-status";

interface IntegrationCategoryBadgeProps {
  category: IntegrationCategory;
  className?: string;
}

const CATEGORY_VARIANT: Record<
  IntegrationCategory,
  "default" | "secondary" | "outline" | "destructive"
> = {
  payment: "default",
  accounting: "default",
  delivery: "secondary",
  messaging: "secondary",
  email: "outline",
  sms: "outline",
  whatsapp: "outline",
  maps: "outline",
  identity: "secondary",
  storage: "outline",
  ai: "default",
  erp: "secondary",
  custom: "outline",
};

export function IntegrationCategoryBadge({ category, className }: IntegrationCategoryBadgeProps) {
  return (
    <Badge variant={CATEGORY_VARIANT[category]} className={cn("font-normal", className)}>
      {INTEGRATION_CATEGORY_LABELS[category]}
    </Badge>
  );
}
