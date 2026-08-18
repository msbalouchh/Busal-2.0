import "server-only";

import { ROUTES } from "@/constants/routes";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_STATUSES } from "@/modules/billing/constants/billing-status";
import { loadCommercialOperations } from "@/modules/commercial-foundation/lib/commercial-settings";
import { ACTIVE_SUBSCRIPTION_STATUSES } from "@/modules/finance/feature-access/constants/subscription-plans";

const GRACE_STATUSES = new Set<string>([
  SUBSCRIPTION_STATUSES.PAST_DUE.toUpperCase(),
]);

const BLOCKED_STATUSES = new Set<string>([
  SUBSCRIPTION_STATUSES.CANCELLED.toUpperCase(),
  SUBSCRIPTION_STATUSES.EXPIRED.toUpperCase(),
  SUBSCRIPTION_STATUSES.PAUSED.toUpperCase(),
  SUBSCRIPTION_STATUSES.PENDING_ACTIVATION.toUpperCase(),
]);

export interface SubscriptionAccessSnapshot {
  allowed: boolean;
  status: string | null;
  redirectTo: string | null;
  reason:
    | "missing_tenant"
    | "inactive"
    | "trial_expired"
    | "pending_activation"
    | "cancelled"
    | null;
}

function billingRequiredRedirect(): string {
  return `${ROUTES.dashboardBilling}?billing=required`;
}

export async function resolveSubscriptionAccess(
  businessId: string,
): Promise<SubscriptionAccessSnapshot> {
  const tenant = await prisma.tenantRecord.findUnique({
    where: { businessId },
    select: { subscriptionStatus: true },
  });

  if (!tenant) {
    return {
      allowed: false,
      status: null,
      redirectTo: ROUTES.businessOnboarding,
      reason: "missing_tenant",
    };
  }

  const status = (tenant.subscriptionStatus ?? "").toUpperCase();
  const commercial = await loadCommercialOperations(businessId).catch(() => null);

  if (BLOCKED_STATUSES.has(status)) {
    return {
      allowed: false,
      status,
      redirectTo:
        status === SUBSCRIPTION_STATUSES.PENDING_ACTIVATION.toUpperCase()
          ? `${ROUTES.businessOnboarding}?step=9&billing=required`
          : billingRequiredRedirect(),
      reason:
        status === SUBSCRIPTION_STATUSES.PENDING_ACTIVATION.toUpperCase()
          ? "pending_activation"
          : status === SUBSCRIPTION_STATUSES.CANCELLED.toUpperCase()
            ? "cancelled"
            : "inactive",
    };
  }

  if (ACTIVE_SUBSCRIPTION_STATUSES.has(status) || GRACE_STATUSES.has(status)) {
    return { allowed: true, status, redirectTo: null, reason: null };
  }

  if (
    commercial?.trialEndsAt &&
    new Date(commercial.trialEndsAt).getTime() > Date.now() &&
    (status === SUBSCRIPTION_STATUSES.TRIALING.toUpperCase() || status === "TRIAL")
  ) {
    return { allowed: true, status, redirectTo: null, reason: null };
  }

  if (commercial?.trialEndsAt && new Date(commercial.trialEndsAt).getTime() <= Date.now()) {
    return {
      allowed: false,
      status,
      redirectTo: billingRequiredRedirect(),
      reason: "trial_expired",
    };
  }

  return {
    allowed: false,
    status,
    redirectTo: billingRequiredRedirect(),
    reason: "inactive",
  };
}
