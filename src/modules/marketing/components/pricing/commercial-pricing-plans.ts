import { ROUTES } from "@/constants/routes";
import {
  getCommercialPlanMonthlyAmount,
  listPublicCommercialPlans,
} from "@/modules/billing/lib/commercial-plan-display";
import { BUSAL_COMMERCIAL_PLAN_SLUGS } from "@/modules/control-center/billing/registry/subscription-plan-registry";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import type { PlanTier } from "@/modules/marketing/components/pricing/pricing-data";

const MARKETING_PLAN_COPY: Record<
  PlanTier,
  {
    tagline: string;
    features: string[];
    ai: string[];
    users: string;
    locations: string;
    cta: string;
    ctaHref: string;
    featured: boolean;
  }
> = {
  "busal-core": {
    tagline: "Single location · Core operations",
    features: [
      "Core POS, orders & kitchen",
      "QR menu & basic reservations",
      "Essential CRM & inventory",
      "Standard reports & analytics",
      "Email support",
    ],
    ai: ["Standard AI assistant"],
    users: "Up to 10 users",
    locations: "1 location",
    cta: "Start Free Trial",
    ctaHref: ROUTES.signup,
    featured: false,
  },
  "busal-growth": {
    tagline: "Growing businesses · AI automation",
    features: [
      "Everything in Core",
      "Multi-user collaboration",
      "CRM, loyalty & marketing campaigns",
      "Advanced analytics & reports",
      "Priority support",
    ],
    ai: ["AI Manager", "AI Marketing", "AI Operations", "Workflow automation"],
    users: "Up to 50 users",
    locations: "Up to 10 locations",
    cta: "Start Free Trial",
    ctaHref: ROUTES.signup,
    featured: true,
  },
  "busal-pro": {
    tagline: "Advanced operators · Full platform",
    features: [
      "Everything in Growth",
      "Finance, inventory & advanced automation",
      "Expanded analytics & reporting",
      "Higher API and integration limits",
      "Priority support",
    ],
    ai: ["Advanced AI agents", "Workflow automation", "Operations intelligence"],
    users: "Up to 500 users",
    locations: "Up to 100 locations",
    cta: "Start Free Trial",
    ctaHref: ROUTES.signup,
    featured: false,
  },
  "busal-enterprise": {
    tagline: "Multi-branch · Custom scale · Enterprise SLAs",
    features: [
      "Everything in Pro",
      "Dedicated onboarding & success",
      "Custom integrations & API access",
      "SSO & enterprise security controls",
      "Volume pricing & custom SLAs",
    ],
    ai: ["Full AI agent suite", "Custom automations", "Executive AI briefings"],
    users: "Unlimited users",
    locations: "Unlimited locations",
    cta: "Talk to Sales",
    ctaHref: MARKETING_ROUTES.contact,
    featured: false,
  },
};

export function buildMarketingPricingPlans() {
  return listPublicCommercialPlans().map((definition) => {
    const id = definition.slug as PlanTier;
    const copy = MARKETING_PLAN_COPY[id];

    return {
      id,
      name: definition.name,
      tagline: copy.tagline,
      monthly: getCommercialPlanMonthlyAmount(definition),
      features: copy.features,
      ai: copy.ai,
      users: copy.users,
      locations: copy.locations,
      cta: copy.cta,
      ctaHref: copy.ctaHref,
      featured: copy.featured,
    };
  });
}

export const DEFAULT_HIGHLIGHT_PLAN: PlanTier = BUSAL_COMMERCIAL_PLAN_SLUGS.GROWTH;
