import "server-only";

import type { PlatformCloudBillingCycle, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const CLOUD_ALL_FEATURES = [
  "restaurant_module",
  "ai_platform",
  "crm",
  "hr",
  "finance",
  "marketing",
  "marketplace",
  "developer_platform",
  "integrations",
  "documents",
  "automation",
  "communication",
];

export async function ensureDefaultSubscriptionPlans() {
  const existing = await prisma.platformCloudSubscriptionPlan.count();
  if (existing > 0) return;

  const plans = [
    {
      name: "Starter",
      slug: "starter",
      description: "For small teams getting started",
      price: 29,
      billingCycle: "MONTHLY" as PlatformCloudBillingCycle,
      features: ["restaurant_module", "crm"],
      limits: { users: 5, branches: 1, apiCalls: 10000 },
    },
    {
      name: "Professional",
      slug: "professional",
      description: "For growing businesses",
      price: 79,
      billingCycle: "MONTHLY" as PlatformCloudBillingCycle,
      features: ["restaurant_module", "crm", "ai_platform", "documents"],
      limits: { users: 25, branches: 5, apiCalls: 50000 },
    },
    {
      name: "Business",
      slug: "business",
      description: "For multi-location operations",
      price: 199,
      billingCycle: "MONTHLY" as PlatformCloudBillingCycle,
      features: ["restaurant_module", "crm", "ai_platform", "marketplace", "automation"],
      limits: { users: 100, branches: 20, apiCalls: 200000 },
    },
    {
      name: "Enterprise",
      slug: "enterprise",
      description: "For enterprise deployments",
      price: 499,
      billingCycle: "YEARLY" as PlatformCloudBillingCycle,
      features: CLOUD_ALL_FEATURES,
      limits: { users: 1000, branches: 100, apiCalls: 1000000 },
    },
    {
      name: "Custom",
      slug: "custom",
      description: "Tailored plan",
      price: 0,
      billingCycle: "LIFETIME" as PlatformCloudBillingCycle,
      features: [],
      limits: {},
    },
  ];

  for (const plan of plans) {
    await prisma.platformCloudSubscriptionPlan.create({
      data: {
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        price: plan.price,
        billingCycle: plan.billingCycle,
        features: plan.features as Prisma.InputJsonValue,
        limits: plan.limits as Prisma.InputJsonValue,
      },
    });
  }
}

export async function listSubscriptionPlans() {
  await ensureDefaultSubscriptionPlans();
  return prisma.platformCloudSubscriptionPlan.findMany({
    where: { status: "ACTIVE" },
    orderBy: { price: "asc" },
  });
}

export async function getSubscriptionPlan(planIdOrSlug: string) {
  return prisma.platformCloudSubscriptionPlan.findFirst({
    where: { OR: [{ id: planIdOrSlug }, { slug: planIdOrSlug }] },
  });
}

export async function createSubscriptionPlan(input: {
  name: string;
  slug: string;
  description?: string;
  price?: number;
  billingCycle?: PlatformCloudBillingCycle;
  features?: string[];
  limits?: Record<string, number>;
}) {
  return prisma.platformCloudSubscriptionPlan.create({
    data: {
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase(),
      description: input.description ?? "",
      price: input.price ?? 0,
      billingCycle: input.billingCycle ?? "MONTHLY",
      features: (input.features ?? []) as Prisma.InputJsonValue,
      limits: (input.limits ?? {}) as Prisma.InputJsonValue,
    },
  });
}
