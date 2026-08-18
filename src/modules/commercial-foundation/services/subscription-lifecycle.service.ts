import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  BILLING_CYCLES,
  SUBSCRIPTION_STATUSES,
  TRIAL_DURATION_DAYS,
} from "@/modules/billing/constants/billing-status";
import type {
  ApplyCouponInput,
  BillingRecord,
  DowngradeSubscriptionInput,
  UpgradeSubscriptionInput,
} from "@/modules/billing/types/billing-platform";
import {
  loadCommercialOperations,
  mergeCommercialOperations,
  saveCommercialOperations,
} from "@/modules/commercial-foundation/lib/commercial-settings";
import {
  assignFeaturesForPlan,
  updateTenantPlanLimits,
} from "@/modules/commercial-foundation/services/stripe-billing.service";
import { buildBillingRecordForBusiness } from "@/modules/commercial-foundation/services/billing-record.service";
import {
  findCatalogPlanById,
  findCatalogPlanBySlug,
  isTrialPlan,
} from "@/modules/commercial-foundation/lib/plan-catalog";
import { DOMAIN_EVENT_TYPES } from "@/modules/platform-orchestration/constants/domain-events";
import { publishModuleDomainEvent } from "@/modules/platform-orchestration/lib/publish-module-event";

function billingScope(businessId: string) {
  return {
    tenantId: businessId,
    workspaceId: businessId,
    businessId,
    branchId: null,
    userId: "system",
  };
}

/** Production subscription lifecycle (upgrade, downgrade, pause, cancel, renew). */
export class SubscriptionLifecycleService {
  async loadRecord(businessId: string): Promise<BillingRecord> {
    return buildBillingRecordForBusiness(businessId);
  }

  async upgradeSubscription(businessId: string, input: UpgradeSubscriptionInput): Promise<BillingRecord> {
    const targetPlan = findCatalogPlanById(input.targetPlanId);
    if (!targetPlan) {
      throw new Error("Target plan not found");
    }

    await prisma.tenantRecord.update({
      where: { businessId },
      data: {
        subscriptionPlan: targetPlan.slug,
        subscriptionStatus: SUBSCRIPTION_STATUSES.ACTIVE,
      },
    });

    await updateTenantPlanLimits(businessId, targetPlan.slug);

    const record = await buildBillingRecordForBusiness(businessId);

    await publishModuleDomainEvent(billingScope(businessId), {
      eventType: DOMAIN_EVENT_TYPES.SUBSCRIPTION_UPDATED,
      aggregateId: record.subscription.id,
      payload: { planId: targetPlan.id, action: "upgrade" },
    });

    await publishModuleDomainEvent(billingScope(businessId), {
      eventType: DOMAIN_EVENT_TYPES.PLAN_CHANGED,
      aggregateId: businessId,
      payload: { previousPlanId: input.subscriptionId, planId: targetPlan.id },
    });

    return record;
  }

  async downgradeSubscription(businessId: string, input: DowngradeSubscriptionInput): Promise<BillingRecord> {
    const targetPlan = findCatalogPlanById(input.targetPlanId);
    if (!targetPlan) {
      throw new Error("Target plan not found");
    }

    if (input.effectiveAt !== "period_end") {
      await prisma.tenantRecord.update({
        where: { businessId },
        data: {
          subscriptionPlan: targetPlan.slug,
          subscriptionStatus: SUBSCRIPTION_STATUSES.ACTIVE,
        },
      });
      await updateTenantPlanLimits(businessId, targetPlan.slug);
    }

    const record = await buildBillingRecordForBusiness(businessId);

    await publishModuleDomainEvent(billingScope(businessId), {
      eventType: DOMAIN_EVENT_TYPES.SUBSCRIPTION_UPDATED,
      aggregateId: record.subscription.id,
      payload: { planId: targetPlan.id, action: "downgrade", effectiveAt: input.effectiveAt ?? "immediate" },
    });

    return record;
  }

  async pauseSubscription(businessId: string): Promise<BillingRecord> {
    await prisma.tenantRecord.update({
      where: { businessId },
      data: { subscriptionStatus: SUBSCRIPTION_STATUSES.PAUSED },
    });

    const record = await buildBillingRecordForBusiness(businessId);

    await publishModuleDomainEvent(billingScope(businessId), {
      eventType: DOMAIN_EVENT_TYPES.SUBSCRIPTION_UPDATED,
      aggregateId: record.subscription.id,
      payload: { action: "pause" },
    });

    return record;
  }

  async resumeSubscription(businessId: string): Promise<BillingRecord> {
    await prisma.tenantRecord.update({
      where: { businessId },
      data: { subscriptionStatus: SUBSCRIPTION_STATUSES.ACTIVE, suspendedAt: null },
    });

    const record = await buildBillingRecordForBusiness(businessId);

    await publishModuleDomainEvent(billingScope(businessId), {
      eventType: DOMAIN_EVENT_TYPES.SUBSCRIPTION_UPDATED,
      aggregateId: record.subscription.id,
      payload: { action: "resume" },
    });

    return record;
  }

  async cancelSubscription(businessId: string, atPeriodEnd = true): Promise<BillingRecord> {
    const commercial = await loadCommercialOperations(businessId);

    await prisma.tenantRecord.update({
      where: { businessId },
      data: {
        subscriptionStatus: atPeriodEnd ? SUBSCRIPTION_STATUSES.ACTIVE : SUBSCRIPTION_STATUSES.CANCELLED,
        ...(atPeriodEnd ? {} : { archivedAt: new Date() }),
      },
    });

    const record = await buildBillingRecordForBusiness(businessId);
    record.subscription.cancelAtPeriodEnd = atPeriodEnd;
    if (!atPeriodEnd) {
      record.subscription.cancelledAt = new Date().toISOString();
    }

    await publishModuleDomainEvent(billingScope(businessId), {
      eventType: DOMAIN_EVENT_TYPES.SUBSCRIPTION_CANCELLED,
      aggregateId: record.subscription.id,
      payload: { atPeriodEnd },
    });

    await saveCommercialOperations(businessId, commercial);

    return record;
  }

  async renewSubscription(businessId: string): Promise<BillingRecord> {
    await prisma.tenantRecord.update({
      where: { businessId },
      data: {
        subscriptionStatus: SUBSCRIPTION_STATUSES.ACTIVE,
        archivedAt: null,
        suspendedAt: null,
        deletedAt: null,
      },
    });

    const record = await buildBillingRecordForBusiness(businessId);

    await publishModuleDomainEvent(billingScope(businessId), {
      eventType: DOMAIN_EVENT_TYPES.SUBSCRIPTION_UPDATED,
      aggregateId: record.subscription.id,
      payload: { action: "renew" },
    });

    return record;
  }

  async startTrial(businessId: string, planId: string, trialDays = TRIAL_DURATION_DAYS): Promise<BillingRecord> {
    const plan = findCatalogPlanById(planId);
    if (!plan) {
      throw new Error("Plan not found");
    }

    const trialStartedAt = new Date();
    const trialEndsAt = new Date(trialStartedAt);
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    await prisma.tenantRecord.update({
      where: { businessId },
      data: {
        subscriptionPlan: plan.slug,
        subscriptionStatus: SUBSCRIPTION_STATUSES.TRIALING,
      },
    });

    await mergeCommercialOperations(businessId, {
      trialStartedAt: trialStartedAt.toISOString(),
      trialEndsAt: trialEndsAt.toISOString(),
    });

    await updateTenantPlanLimits(businessId, plan.slug);

    const record = await buildBillingRecordForBusiness(businessId);

    await publishModuleDomainEvent(billingScope(businessId), {
      eventType: DOMAIN_EVENT_TYPES.SUBSCRIPTION_CREATED,
      aggregateId: record.subscription.id,
      payload: { planId: plan.id, trial: true, trialDays },
    });

    return record;
  }

  async applyCoupon(businessId: string, input: ApplyCouponInput): Promise<BillingRecord> {
    const commercial = await loadCommercialOperations(businessId);

    if (!commercial.couponsApplied.includes(input.couponCode)) {
      await mergeCommercialOperations(businessId, {
        couponsApplied: [...commercial.couponsApplied, input.couponCode],
      });
    }

    return buildBillingRecordForBusiness(businessId);
  }

  async assignPlan(
    businessId: string,
    planSlug: string,
    status: string = SUBSCRIPTION_STATUSES.ACTIVE,
  ): Promise<BillingRecord> {
    const plan = findCatalogPlanBySlug(planSlug) ?? findCatalogPlanById(planSlug);
    if (!plan) {
      throw new Error(`Plan ${planSlug} not found`);
    }

    await prisma.tenantRecord.update({
      where: { businessId },
      data: {
        subscriptionPlan: plan.slug,
        subscriptionStatus: status,
      },
    });

    await updateTenantPlanLimits(businessId, plan.slug);

    if (isTrialPlan(plan.slug)) {
      const trialStartedAt = new Date();
      const trialEndsAt = new Date(trialStartedAt);
      trialEndsAt.setDate(trialEndsAt.getDate() + (plan.trialDays || TRIAL_DURATION_DAYS));
      await mergeCommercialOperations(businessId, {
        trialStartedAt: trialStartedAt.toISOString(),
        trialEndsAt: trialEndsAt.toISOString(),
      });
    }

    const record = await buildBillingRecordForBusiness(businessId);

    await publishModuleDomainEvent(billingScope(businessId), {
      eventType: DOMAIN_EVENT_TYPES.SUBSCRIPTION_CREATED,
      aggregateId: record.subscription.id,
      payload: { planId: plan.id, billingCycle: BILLING_CYCLES.MONTHLY },
    });

    return record;
  }
}

export const subscriptionLifecycleService = new SubscriptionLifecycleService();
