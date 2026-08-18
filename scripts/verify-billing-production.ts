import {
  BUSAL_COMMERCIAL_PLAN_SLUGS,
  getSubscriptionPlanBySlug,
} from "../src/modules/control-center/billing/registry/subscription-plan-registry";
import { SUBSCRIPTION_STATUSES, TRIAL_DURATION_DAYS } from "../src/modules/billing/constants/billing-status";
import {
  assertCheckoutEligiblePlanSlug,
  getOfficialPlanMonthlyPricePence,
  isEnterprisePlanSlug,
  validateProductionStripeBillingConfig,
} from "../src/modules/commercial-foundation/services/stripe-billing-config.service";
import { resolveSubscriptionAccess } from "../src/modules/commercial-foundation/services/subscription-access.service";
import { isDevelopmentBillingFallbackAllowed } from "../src/lib/production-mode";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log("Billing production verification");

  assert(getOfficialPlanMonthlyPricePence(BUSAL_COMMERCIAL_PLAN_SLUGS.CORE) === 29_900, "Core price");
  assert(getOfficialPlanMonthlyPricePence(BUSAL_COMMERCIAL_PLAN_SLUGS.GROWTH) === 39_900, "Growth price");
  assert(getOfficialPlanMonthlyPricePence(BUSAL_COMMERCIAL_PLAN_SLUGS.PRO) === 49_900, "Pro price");

  assert(isEnterprisePlanSlug(BUSAL_COMMERCIAL_PLAN_SLUGS.ENTERPRISE), "enterprise slug");
  let enterpriseRejected = false;
  try {
    assertCheckoutEligiblePlanSlug(BUSAL_COMMERCIAL_PLAN_SLUGS.ENTERPRISE);
  } catch {
    enterpriseRejected = true;
  }
  assert(enterpriseRejected, "enterprise checkout must be blocked");

  assert(TRIAL_DURATION_DAYS === 15, "trial duration");

  const core = getSubscriptionPlanBySlug(BUSAL_COMMERCIAL_PLAN_SLUGS.CORE);
  assert(core?.mrrPence === 29_900, "core catalog");

  const validation = validateProductionStripeBillingConfig();
  if (process.env.NODE_ENV === "production") {
    assert(validation.valid, `production stripe config invalid: ${validation.issues.map((i) => i.key).join(", ")}`);
  } else {
    console.log(
      validation.valid
        ? "Stripe production config present"
        : `Stripe production config incomplete (${validation.issues.length} issue(s)) — expected in local dev`,
    );
  }

  assert(!isDevelopmentBillingFallbackAllowed() || process.env.NODE_ENV !== "production", "dev bypass blocked in production");

  const pendingAccess = await resolveSubscriptionAccess("billing-verify-nonexistent");
  assert(!pendingAccess.allowed, "missing tenant blocked");

  console.log("Billing production verification passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
