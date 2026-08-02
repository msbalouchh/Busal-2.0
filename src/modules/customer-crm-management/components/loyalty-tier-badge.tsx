import type { LoyaltyTier } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { LOYALTY_TIER_LABELS } from "@/modules/customer-crm-management/lib/customer-crm-validation";

const TIER_VARIANT: Record<LoyaltyTier, "default" | "secondary" | "outline"> = {
  BRONZE: "outline",
  SILVER: "secondary",
  GOLD: "default",
  PLATINUM: "default",
  VIP: "default",
};

interface LoyaltyTierBadgeProps {
  tier: LoyaltyTier;
}

export function LoyaltyTierBadge({ tier }: LoyaltyTierBadgeProps) {
  return <Badge variant={TIER_VARIANT[tier]}>{LOYALTY_TIER_LABELS[tier]}</Badge>;
}
