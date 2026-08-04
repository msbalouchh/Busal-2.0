import {
  BILLING_INVOICE_STATUSES,
  BILLING_PAYMENT_STATUSES,
  SUBSCRIPTION_STATUSES,
} from "@/modules/billing/constants/billing-status";
import {
  DEFAULT_BILLING_SCOPE,
  MOCK_BILLING_RECORD,
  MOCK_SUBSCRIPTION_PLANS,
} from "@/modules/billing/constants/mock-data";
import type {
  ApplyCouponInput,
  BillingInvoice,
  BillingRecord,
  BillingSearchQuery,
  DowngradeSubscriptionInput,
  SubscriptionPlan,
  UpgradeSubscriptionInput,
} from "@/modules/billing/types/billing-platform";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** In-memory billing repository (mock only, no backend). */
export class BillingRepository {
  private record: BillingRecord = structuredClone(MOCK_BILLING_RECORD);
  private plans: SubscriptionPlan[] = structuredClone(MOCK_SUBSCRIPTION_PLANS);

  getRecord(): BillingRecord {
    return structuredClone(this.record);
  }

  getPlans(): SubscriptionPlan[] {
    return structuredClone(this.plans);
  }

  findPlanById(planId: string): SubscriptionPlan | undefined {
    return this.plans.find((plan) => plan.id === planId);
  }

  findPlanByType(planType: SubscriptionPlan["planType"]): SubscriptionPlan | undefined {
    return this.plans.find((plan) => plan.planType === planType);
  }

  searchPlans(query: BillingSearchQuery = {}): SubscriptionPlan[] {
    let results = structuredClone(this.plans);

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

  getOpenInvoices(): BillingInvoice[] {
    return this.record.invoices.filter(
      (inv) =>
        inv.status === BILLING_INVOICE_STATUSES.OPEN ||
        inv.status === BILLING_INVOICE_STATUSES.DRAFT,
    );
  }

  getFailedPayments(): BillingRecord["payments"] {
    return this.record.payments.filter(
      (payment) => payment.status === BILLING_PAYMENT_STATUSES.FAILED,
    );
  }

  upgradeSubscription(input: UpgradeSubscriptionInput): BillingRecord {
    const targetPlan = this.findPlanById(input.targetPlanId);

    if (!targetPlan) {
      return structuredClone(this.record);
    }

    const now = new Date().toISOString();

    this.record.plan = structuredClone(targetPlan);
    this.record.subscription.planId = targetPlan.id;
    this.record.subscription.mrrCents = targetPlan.monthlyPriceCents;
    this.record.subscription.updatedAt = now;
    this.record.workspaceSubscription.planId = targetPlan.id;
    this.record.workspaceSubscription.featureAccess = structuredClone(targetPlan.featureAccess);
    this.record.analytics.upgradeCount += 1;
    this.record.analytics.mrrCents = targetPlan.monthlyPriceCents;
    this.record.analytics.arrCents = targetPlan.monthlyPriceCents * 12;

    return structuredClone(this.record);
  }

  downgradeSubscription(input: DowngradeSubscriptionInput): BillingRecord {
    const targetPlan = this.findPlanById(input.targetPlanId);

    if (!targetPlan) {
      return structuredClone(this.record);
    }

    const now = new Date().toISOString();

    this.record.plan = structuredClone(targetPlan);
    this.record.subscription.planId = targetPlan.id;
    this.record.subscription.mrrCents = targetPlan.monthlyPriceCents;
    this.record.subscription.updatedAt = now;
    this.record.workspaceSubscription.planId = targetPlan.id;
    this.record.workspaceSubscription.featureAccess = structuredClone(targetPlan.featureAccess);
    this.record.analytics.downgradeCount += 1;
    this.record.analytics.mrrCents = targetPlan.monthlyPriceCents;
    this.record.analytics.arrCents = targetPlan.monthlyPriceCents * 12;

    if (input.effectiveAt === "period_end") {
      this.record.subscription.cancelAtPeriodEnd = false;
    }

    return structuredClone(this.record);
  }

  pauseSubscription(): BillingRecord {
    const now = new Date().toISOString();
    this.record.subscription.status = SUBSCRIPTION_STATUSES.PAUSED;
    this.record.subscription.pausedAt = now;
    this.record.subscription.updatedAt = now;
    this.record.workspaceSubscription.status = SUBSCRIPTION_STATUSES.PAUSED;
    return structuredClone(this.record);
  }

  resumeSubscription(): BillingRecord {
    const now = new Date().toISOString();
    this.record.subscription.status = SUBSCRIPTION_STATUSES.ACTIVE;
    this.record.subscription.pausedAt = null;
    this.record.subscription.updatedAt = now;
    this.record.workspaceSubscription.status = SUBSCRIPTION_STATUSES.ACTIVE;
    return structuredClone(this.record);
  }

  cancelSubscription(atPeriodEnd = true): BillingRecord {
    const now = new Date().toISOString();
    this.record.subscription.cancelAtPeriodEnd = atPeriodEnd;
    this.record.subscription.cancelledAt = atPeriodEnd ? null : now;
    this.record.subscription.updatedAt = now;

    if (!atPeriodEnd) {
      this.record.subscription.status = SUBSCRIPTION_STATUSES.CANCELLED;
      this.record.workspaceSubscription.status = SUBSCRIPTION_STATUSES.CANCELLED;
    }

    return structuredClone(this.record);
  }

  applyCoupon(input: ApplyCouponInput): BillingRecord {
    const coupon = this.record.coupons.find(
      (c) => c.code.toLowerCase() === input.couponCode.toLowerCase() && c.isActive,
    );

    if (!coupon) {
      return structuredClone(this.record);
    }

    const now = new Date().toISOString();
    const discountCents =
      coupon.discountType === "percentage" && coupon.valueBps !== null
        ? Math.round((this.record.subscription.mrrCents * coupon.valueBps) / 10000)
        : (coupon.amountCents ?? 0);

    this.record.discounts.push({
      id: createId("disc"),
      subscriptionId: input.subscriptionId,
      couponId: coupon.id,
      couponCode: coupon.code,
      amountCents: discountCents,
      appliedAt: now,
      expiresAt: coupon.validTo,
    });

    coupon.redemptionCount += 1;
    this.record.analytics.couponRedemptionCount += 1;

    return structuredClone(this.record);
  }

  generateInvoice(): BillingInvoice {
    const now = new Date().toISOString();
    const invoiceId = createId("binv");
    const subtotalCents = this.record.subscription.mrrCents;
    const taxCents = Math.round(subtotalCents * 0.2);
    const totalCents = subtotalCents + taxCents;

    const invoice: BillingInvoice = {
      id: invoiceId,
      tenantId: DEFAULT_BILLING_SCOPE.tenantId,
      workspaceId: DEFAULT_BILLING_SCOPE.workspaceId,
      subscriptionId: this.record.subscription.id,
      invoiceNumber: `BUSAL-INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      status: BILLING_INVOICE_STATUSES.OPEN,
      subtotalCents,
      discountCents: 0,
      taxCents,
      totalCents,
      amountPaidCents: 0,
      amountDueCents: totalCents,
      currency: this.record.subscription.currency,
      periodStart: this.record.subscription.currentPeriodStart,
      periodEnd: this.record.subscription.currentPeriodEnd,
      dueDate: now.slice(0, 10),
      paidAt: null,
      lineItems: [
        {
          id: createId("bline"),
          invoiceId,
          description: `${this.record.plan.name} Plan — ${this.record.subscription.billingCycle}`,
          quantity: 1,
          unitAmountCents: subtotalCents,
          amountCents: subtotalCents,
          periodStart: this.record.subscription.currentPeriodStart,
          periodEnd: this.record.subscription.currentPeriodEnd,
        },
      ],
      createdAt: now,
    };

    this.record.invoices.push(invoice);
    return structuredClone(invoice);
  }
}

export const billingRepository = new BillingRepository();
