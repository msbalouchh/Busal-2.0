import { BILLING_INVOICE_STATUSES } from "@/modules/billing/constants/billing-status";
import { billingRepository } from "@/modules/billing/repository/billing-repository";
import { DOMAIN_EVENT_TYPES } from "@/modules/platform-orchestration/constants/domain-events";
import { publishModuleDomainEvent } from "@/modules/platform-orchestration/lib/publish-module-event";
import type {
  ApplyCouponInput,
  BillingInvoice,
  BillingRecord,
  BillingSearchQuery,
  DowngradeSubscriptionInput,
  SubscriptionPlan,
  UpgradeSubscriptionInput,
} from "@/modules/billing/types/billing-platform";

/** Domain service for billing and subscription operations. */
export class BillingService {
  private billingScope(businessId = "platform") {
    return {
      tenantId: businessId,
      workspaceId: businessId,
      businessId,
      branchId: null,
      userId: "system",
    };
  }

  getRecord(): BillingRecord {
    return billingRepository.getRecord();
  }

  async loadRecord(businessId: string): Promise<BillingRecord> {
    return billingRepository.loadRecord(businessId);
  }

  getPlans(): SubscriptionPlan[] {
    return billingRepository.getPlans();
  }

  getPlanById(planId: string): SubscriptionPlan | null {
    return billingRepository.findPlanById(planId) ?? null;
  }

  searchPlans(query: BillingSearchQuery = {}): SubscriptionPlan[] {
    return billingRepository.searchPlans(query);
  }

  getOpenInvoices(): BillingInvoice[] {
    return billingRepository.getOpenInvoices();
  }

  getFailedPayments(): BillingRecord["payments"] {
    return billingRepository.getFailedPayments();
  }

  upgradeSubscription(input: UpgradeSubscriptionInput, businessId?: string): BillingRecord {
    if (businessId) {
      void billingRepository.upgradeSubscription(businessId, input);
    }
    const record = billingRepository.upgradeSubscriptionSync(input);
    void publishModuleDomainEvent(this.billingScope(businessId), {
      eventType: DOMAIN_EVENT_TYPES.SUBSCRIPTION_UPDATED,
      aggregateId: record.subscription.id,
      payload: { subscriptionId: record.subscription.id, planId: input.targetPlanId },
    });
    return record;
  }

  async upgradeSubscriptionForBusiness(
    businessId: string,
    input: UpgradeSubscriptionInput,
  ): Promise<BillingRecord> {
    const record = await billingRepository.upgradeSubscription(businessId, input);
    await publishModuleDomainEvent(this.billingScope(businessId), {
      eventType: DOMAIN_EVENT_TYPES.SUBSCRIPTION_UPDATED,
      aggregateId: record.subscription.id,
      payload: { subscriptionId: record.subscription.id, planId: input.targetPlanId },
    });
    return record;
  }

  downgradeSubscription(input: DowngradeSubscriptionInput, businessId?: string): BillingRecord {
    if (businessId) {
      void billingRepository.downgradeSubscription(businessId, input);
    }
    const record = billingRepository.downgradeSubscriptionSync(input);
    void publishModuleDomainEvent(this.billingScope(businessId), {
      eventType: DOMAIN_EVENT_TYPES.SUBSCRIPTION_UPDATED,
      aggregateId: record.subscription.id,
      payload: { subscriptionId: record.subscription.id, planId: input.targetPlanId },
    });
    return record;
  }

  async downgradeSubscriptionForBusiness(
    businessId: string,
    input: DowngradeSubscriptionInput,
  ): Promise<BillingRecord> {
    return billingRepository.downgradeSubscription(businessId, input);
  }

  pauseSubscription(businessId?: string): BillingRecord {
    if (businessId) {
      void billingRepository.pauseSubscription(businessId);
    }
    return billingRepository.pauseSubscriptionSync();
  }

  async pauseSubscriptionForBusiness(businessId: string): Promise<BillingRecord> {
    return billingRepository.pauseSubscription(businessId);
  }

  resumeSubscription(businessId?: string): BillingRecord {
    if (businessId) {
      void billingRepository.resumeSubscription(businessId);
    }
    return billingRepository.resumeSubscriptionSync();
  }

  async resumeSubscriptionForBusiness(businessId: string): Promise<BillingRecord> {
    return billingRepository.resumeSubscription(businessId);
  }

  cancelSubscription(atPeriodEnd = true, businessId?: string): BillingRecord {
    if (businessId) {
      void billingRepository.cancelSubscription(businessId, atPeriodEnd);
    }
    const record = billingRepository.cancelSubscriptionSync(atPeriodEnd);
    void publishModuleDomainEvent(this.billingScope(businessId), {
      eventType: DOMAIN_EVENT_TYPES.SUBSCRIPTION_CANCELLED,
      aggregateId: record.subscription.id,
      payload: { atPeriodEnd },
    });
    return record;
  }

  async cancelSubscriptionForBusiness(
    businessId: string,
    atPeriodEnd = true,
  ): Promise<BillingRecord> {
    return billingRepository.cancelSubscription(businessId, atPeriodEnd);
  }

  applyCoupon(input: ApplyCouponInput, businessId?: string): BillingRecord {
    if (businessId) {
      void billingRepository.applyCoupon(businessId, input);
    }
    return billingRepository.applyCouponSync(input);
  }

  async applyCouponForBusiness(businessId: string, input: ApplyCouponInput): Promise<BillingRecord> {
    return billingRepository.applyCoupon(businessId, input);
  }

  generateInvoice(): BillingInvoice {
    const record = billingRepository.getRecord();
    const invoiceId = `binv-${Date.now()}`;
    const subtotalCents = record.subscription.mrrCents;
    const taxCents = Math.round(subtotalCents * 0.2);

    return {
      id: invoiceId,
      tenantId: record.subscription.tenantId,
      workspaceId: record.subscription.tenantId,
      subscriptionId: record.subscription.id,
      invoiceNumber: `BUSAL-INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
      status: BILLING_INVOICE_STATUSES.OPEN,
      subtotalCents,
      discountCents: 0,
      taxCents,
      totalCents: subtotalCents + taxCents,
      amountPaidCents: 0,
      amountDueCents: subtotalCents + taxCents,
      currency: record.subscription.currency,
      periodStart: record.subscription.currentPeriodStart,
      periodEnd: record.subscription.currentPeriodEnd,
      dueDate: new Date().toISOString().slice(0, 10),
      paidAt: null,
      lineItems: [],
      createdAt: new Date().toISOString(),
    };
  }
}

export const billingService = new BillingService();
