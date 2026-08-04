import { billingRepository } from "@/modules/billing/repository/billing-repository";
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
  getRecord(): BillingRecord {
    return billingRepository.getRecord();
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

  upgradeSubscription(input: UpgradeSubscriptionInput): BillingRecord {
    return billingRepository.upgradeSubscription(input);
  }

  downgradeSubscription(input: DowngradeSubscriptionInput): BillingRecord {
    return billingRepository.downgradeSubscription(input);
  }

  pauseSubscription(): BillingRecord {
    return billingRepository.pauseSubscription();
  }

  resumeSubscription(): BillingRecord {
    return billingRepository.resumeSubscription();
  }

  cancelSubscription(atPeriodEnd = true): BillingRecord {
    return billingRepository.cancelSubscription(atPeriodEnd);
  }

  applyCoupon(input: ApplyCouponInput): BillingRecord {
    return billingRepository.applyCoupon(input);
  }

  generateInvoice(): BillingInvoice {
    return billingRepository.generateInvoice();
  }
}

export const billingService = new BillingService();
