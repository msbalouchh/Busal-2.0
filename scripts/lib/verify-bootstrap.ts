import type { PrismaClient } from "@prisma/client";

import { ensureBootstrapAutomationPlugins } from "../../src/modules/ai-automation/plugins/bootstrap-automation";
import {
  getAutomationEvent,
  registerAutomationEvent,
} from "../../src/modules/ai-automation/registry/automation-registry";
import { ALL_PLATFORM_MODULE_KEYS } from "../../src/modules/finance/feature-access/constants/feature-registry";
import {
  bootstrapDomainEventRegistry,
  listDomainEventDefinitions,
} from "../../src/modules/platform-orchestration/registry/event-registry";

let bootstrapped = false;

function registerOrchestrationAutomationEvents(): void {
  ensureBootstrapAutomationPlugins();
  bootstrapDomainEventRegistry();

  for (const definition of listDomainEventDefinitions()) {
    if (getAutomationEvent(definition.eventType)) {
      continue;
    }

    registerAutomationEvent({
      eventType: definition.eventType,
      category: definition.category,
      description: definition.description,
      sourceModule: definition.sourceModule,
    });
  }
}

export function bootstrapVerificationEnvironment(): void {
  if (bootstrapped) {
    return;
  }

  bootstrapDomainEventRegistry();
  registerOrchestrationAutomationEvents();
  bootstrapped = true;
}

async function ensureMainBranchForVerification(
  prisma: PrismaClient,
  businessId: string,
): Promise<void> {
  const existing = await prisma.branch.findFirst({
    where: { businessId, isMain: true, isActive: true },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  const fallback = await prisma.branch.findFirst({
    where: { businessId, isActive: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (fallback) {
    await prisma.branch.update({
      where: { id: fallback.id },
      data: { isMain: true },
    });
    return;
  }

  await prisma.branch.create({
    data: {
      businessId,
      name: "Main Branch",
      isMain: true,
      isActive: true,
    },
  });
}

export async function ensureOnboardedBusinessForVerification(
  prisma: PrismaClient,
): Promise<{ ownerId: string; businessId: string }> {
  const owner = await prisma.user.findFirst({
    where: { role: "owner" },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (!owner) {
    throw new Error("No owner user found for verification");
  }

  let business = await prisma.business.findFirst({
    where: { ownerId: owner.id, onboardingCompleted: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (!business) {
    business = await prisma.business.findFirst({
      where: { ownerId: owner.id },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    if (business) {
      await prisma.business.update({
        where: { id: business.id },
        data: { onboardingCompleted: true },
      });
    } else {
      business = await prisma.business.create({
        data: {
          ownerId: owner.id,
          businessName: "Verification Business",
          onboardingCompleted: true,
        },
        select: { id: true },
      });
    }
  }

  await ensureMainBranchForVerification(prisma, business.id);
  await ensureVerificationSubscription(prisma, business.id);

  return { ownerId: owner.id, businessId: business.id };
}

export async function ensureVerificationSubscription(
  prisma: PrismaClient,
  businessId: string,
): Promise<void> {
  await prisma.tenantRecord.upsert({
    where: { businessId },
    create: {
      businessId,
      lifecycleStatus: "ACTIVE",
      subscriptionPlan: "enterprise",
      subscriptionStatus: "ACTIVE",
      assignedFeatures: ALL_PLATFORM_MODULE_KEYS,
    },
    update: {
      lifecycleStatus: "ACTIVE",
      subscriptionPlan: "enterprise",
      subscriptionStatus: "ACTIVE",
      assignedFeatures: ALL_PLATFORM_MODULE_KEYS,
    },
  });
}
