import { BUSAL_COMMERCIAL_PLAN_SLUGS } from "../src/modules/control-center/billing/registry/subscription-plan-registry";
import {
  auditBusalStripeCatalog,
  ensureBusalStripeCatalog,
  listResolvedBusalStripePlans,
} from "../src/modules/commercial-foundation/services/stripe-catalog.service";
import { getStripeMode, isStripeConfigured } from "../src/lib/stripe";

function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

async function main() {
  console.log("Busal Stripe catalog audit");
  console.log(`Stripe configured: ${isStripeConfigured()}`);
  console.log(`Stripe mode: ${getStripeMode()}`);
  console.log("");

  console.log("Authoritative Busal registry mapping:");
  for (const plan of listResolvedBusalStripePlans()) {
    console.log(
      `  ${plan.planName} (${plan.planSlug}) → ${formatPence(plan.mrrPence)}/month GBP`,
    );
  }
  console.log(`  Busal Enterprise (${BUSAL_COMMERCIAL_PLAN_SLUGS.ENTERPRISE}) → custom pricing`);
  console.log("");

  if (!isStripeConfigured()) {
    console.log("STOP: STRIPE_SECRET_KEY is not configured.");
    console.log("Add sk_test_* credentials and re-run this script to audit or provision Stripe catalog objects.");
    process.exitCode = 1;
    return;
  }

  const audits = await auditBusalStripeCatalog();
  for (const audit of audits) {
    console.log(`Plan: ${audit.planName} (${audit.planSlug})`);
    console.log(`  Status: ${audit.status}`);
    if (!audit.customPricing) {
      console.log(`  Expected: ${formatPence(audit.expectedMrrPence)}/month GBP`);
    }
    console.log(`  Env price ID: ${audit.configuredPriceId ?? "(not set)"}`);
    console.log(`  Env product ID: ${audit.configuredProductId ?? "(not set)"}`);
    console.log(`  Stripe products found: ${audit.stripeProductMatches.length}`);
    console.log(`  Stripe monthly GBP prices found: ${audit.stripePriceMatches.length}`);
    for (const note of audit.notes) {
      console.log(`  Note: ${note}`);
    }
    console.log("");
  }

  if (process.env.STRIPE_ALLOW_CATALOG_PROVISIONING === "true") {
    const result = await ensureBusalStripeCatalog();
    console.log("Provision result:");
    console.log(`  Mode: ${result.mode}`);
    console.log(`  Provisioned: ${result.provisioned}`);
    for (const warning of result.warnings) {
      console.log(`  Warning: ${warning}`);
    }
    for (const plan of result.plans) {
      console.log(`  ${plan.planSlug}: product=${plan.productId} price=${plan.priceId}`);
      console.log(`    Set ${plan.productIdEnvKey}=${plan.productId}`);
      console.log(`    Set ${plan.priceIdEnvKey}=${plan.priceId}`);
    }
  } else {
    console.log(
      "Catalog provisioning skipped (set STRIPE_ALLOW_CATALOG_PROVISIONING=true to create missing TEST catalog objects).",
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
