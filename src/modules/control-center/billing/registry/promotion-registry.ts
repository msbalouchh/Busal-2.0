import { TRIAL_DURATION_DAYS } from "@/modules/billing/constants/billing-status";

export interface PromotionDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  discountPercent: number;
  planSlug: string | null;
  trialExtensionDays: number;
  active: boolean;
}

const DEFAULT_PROMOTIONS: PromotionDefinition[] = [
  {
    id: "promo-launch-20",
    code: "LAUNCH20",
    name: "Launch discount",
    description: "20% off first 3 months on Growth plan.",
    discountPercent: 20,
    planSlug: "growth",
    trialExtensionDays: 0,
    active: true,
  },
  {
    id: "promo-trial-14",
    code: "TRIAL14",
    name: "Extended trial",
    description: `Adds ${TRIAL_DURATION_DAYS} days to trial period.`,
    discountPercent: 0,
    planSlug: null,
    trialExtensionDays: TRIAL_DURATION_DAYS,
    active: true,
  },
];

const pluginPromotions: PromotionDefinition[] = [];

export function registerPromotion(promotion: PromotionDefinition): void {
  const index = pluginPromotions.findIndex((entry) => entry.code === promotion.code);
  if (index >= 0) {
    pluginPromotions[index] = promotion;
    return;
  }
  pluginPromotions.push(promotion);
}

export function listPromotions(activeOnly = true): PromotionDefinition[] {
  const promotions = [...DEFAULT_PROMOTIONS, ...pluginPromotions];
  return activeOnly ? promotions.filter((promo) => promo.active) : promotions;
}

export function upsertPromotion(
  input: Omit<PromotionDefinition, "id"> & { id?: string },
): PromotionDefinition {
  const promotion: PromotionDefinition = {
    id: input.id ?? `promo-${input.code.toLowerCase()}`,
    ...input,
  };
  registerPromotion(promotion);
  return promotion;
}

export function ensureBootstrapPromotions(): void {
  for (const promo of DEFAULT_PROMOTIONS) {
    if (!listPromotions(false).some((entry) => entry.code === promo.code)) {
      registerPromotion(promo);
    }
  }
}
