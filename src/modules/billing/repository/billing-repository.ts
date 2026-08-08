import {
  BILLING_INVOICE_STATUSES,
  BILLING_PAYMENT_STATUSES,
  SUBSCRIPTION_STATUSES,
} from "@/modules/billing/constants/billing-status";
import type {
  ApplyCouponInput,
  BillingInvoice,
  BillingRecord,
  BillingSearchQuery,
  DowngradeSubscriptionInput,
  SubscriptionPlan,
  UpgradeSubscriptionInput,
} from "@/modules/billing/types/billing-platform";
import {
  findCatalogPlanById,
  listCatalogPlans,
} from "@/modules/commercial-foundation/lib/plan-catalog";

/** Billing repository — loads production records from commercial foundation. */
export class BillingRepository {
  private clientRecord: BillingRecord | null = null;

  getRecord(): BillingRecord {
    if (!this.clientRecord) {
      throw new Error("Billing record is not loaded. Call loadRecord(businessId) first.");
    }
    return structuredClone(this.clientRecord);
  }

  setClientRecord(record: BillingRecord): void {
    this.clientRecord = structuredClone(record);
  }

  getPlans(): SubscriptionPlan[] {
    return listCatalogPlans();
  }

  findPlanById(planId: string): SubscriptionPlan | undefined {
    return findCatalogPlanById(planId);
  }

  findPlanByType(planType: SubscriptionPlan["planType"]): SubscriptionPlan | undefined {
    return this.getPlans().find((plan) => plan.planType === planType);
  }

  searchPlans(query: BillingSearchQuery = {}): SubscriptionPlan[] {
    let results = this.getPlans();

    if (query.planType) {
      results = results.filter((plan) => plan.planType === query.planType);
    }

    if (query.query) {
      const term = query.query.toLowerCase();
      results = results.filter(
        (plan) =>
          plan.name.toLowerCase().includes(term) || plan.description.toLowerCase().includes(term),
      );
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  private requireRecord(): BillingRecord {
    if (!this.clientRecord) {
      throw new Error("Billing record is not loaded. Call loadRecord(businessId) first.");
    }
    return this.clientRecord;
  }

  getOpenInvoices(): BillingInvoice[] {
    return this.requireRecord().invoices.filter(
      (inv) =>
        inv.status === BILLING_INVOICE_STATUSES.OPEN ||
        inv.status === BILLING_INVOICE_STATUSES.DRAFT,
    );
  }

  getFailedPayments(): BillingRecord["payments"] {
    return this.requireRecord().payments.filter(
      (payment) => payment.status === BILLING_PAYMENT_STATUSES.FAILED,
    );
  }

  async loadRecord(businessId: string): Promise<BillingRecord> {
    const { buildBillingRecordForBusiness } = await import(
      "@/modules/commercial-foundation/services/billing-record.service"
    );
    const record = await buildBillingRecordForBusiness(businessId);
    this.clientRecord = record;
    return structuredClone(record);
  }

  async upgradeSubscription(businessId: string, input: UpgradeSubscriptionInput): Promise<BillingRecord> {
    const { subscriptionLifecycleService } = await import(
      "@/modules/commercial-foundation/services/subscription-lifecycle.service"
    );
    const record = await subscriptionLifecycleService.upgradeSubscription(businessId, input);
    this.clientRecord = record;
    return structuredClone(record);
  }

  async downgradeSubscription(
    businessId: string,
    input: DowngradeSubscriptionInput,
  ): Promise<BillingRecord> {
    const { subscriptionLifecycleService } = await import(
      "@/modules/commercial-foundation/services/subscription-lifecycle.service"
    );
    const record = await subscriptionLifecycleService.downgradeSubscription(businessId, input);
    this.clientRecord = record;
    return structuredClone(record);
  }

  async pauseSubscription(businessId: string): Promise<BillingRecord> {
    const { subscriptionLifecycleService } = await import(
      "@/modules/commercial-foundation/services/subscription-lifecycle.service"
    );
    const record = await subscriptionLifecycleService.pauseSubscription(businessId);
    this.clientRecord = record;
    return structuredClone(record);
  }

  async resumeSubscription(businessId: string): Promise<BillingRecord> {
    const { subscriptionLifecycleService } = await import(
      "@/modules/commercial-foundation/services/subscription-lifecycle.service"
    );
    const record = await subscriptionLifecycleService.resumeSubscription(businessId);
    this.clientRecord = record;
    return structuredClone(record);
  }

  async cancelSubscription(businessId: string, atPeriodEnd = true): Promise<BillingRecord> {
    const { subscriptionLifecycleService } = await import(
      "@/modules/commercial-foundation/services/subscription-lifecycle.service"
    );
    const record = await subscriptionLifecycleService.cancelSubscription(businessId, atPeriodEnd);
    this.clientRecord = record;
    return structuredClone(record);
  }

  async applyCoupon(businessId: string, input: ApplyCouponInput): Promise<BillingRecord> {
    const { subscriptionLifecycleService } = await import(
      "@/modules/commercial-foundation/services/subscription-lifecycle.service"
    );
    const record = await subscriptionLifecycleService.applyCoupon(businessId, input);
    this.clientRecord = record;
    return structuredClone(record);
  }

  upgradeSubscriptionSync(input: UpgradeSubscriptionInput): BillingRecord {
    const record = this.requireRecord();
    const targetPlan = this.findPlanById(input.targetPlanId);
    if (!targetPlan) {
      return this.getRecord();
    }

    record.plan = structuredClone(targetPlan);
    record.subscription.planId = targetPlan.id;
    record.subscription.status = SUBSCRIPTION_STATUSES.ACTIVE;
    this.clientRecord = record;
    return this.getRecord();
  }

  downgradeSubscriptionSync(input: DowngradeSubscriptionInput): BillingRecord {
    const record = this.requireRecord();
    const targetPlan = this.findPlanById(input.targetPlanId);
    if (!targetPlan) {
      return this.getRecord();
    }

    record.plan = structuredClone(targetPlan);
    record.subscription.planId = targetPlan.id;
    this.clientRecord = record;
    return this.getRecord();
  }

  pauseSubscriptionSync(): BillingRecord {
    const record = this.requireRecord();
    record.subscription.status = SUBSCRIPTION_STATUSES.PAUSED;
    this.clientRecord = record;
    return this.getRecord();
  }

  resumeSubscriptionSync(): BillingRecord {
    const record = this.requireRecord();
    record.subscription.status = SUBSCRIPTION_STATUSES.ACTIVE;
    this.clientRecord = record;
    return this.getRecord();
  }

  cancelSubscriptionSync(atPeriodEnd = true): BillingRecord {
    const record = this.requireRecord();
    record.subscription.cancelAtPeriodEnd = atPeriodEnd;
    if (!atPeriodEnd) {
      record.subscription.status = SUBSCRIPTION_STATUSES.CANCELLED;
    }
    this.clientRecord = record;
    return this.getRecord();
  }

  applyCouponSync(input: ApplyCouponInput): BillingRecord {
    const record = this.requireRecord();
    const coupon = record.coupons.find(
      (entry) => entry.code.toLowerCase() === input.couponCode.toLowerCase() && entry.isActive,
    );

    if (!coupon) {
      return this.getRecord();
    }

    coupon.redemptionCount += 1;
    this.clientRecord = record;
    return this.getRecord();
  }
}

export const billingRepository = new BillingRepository();
