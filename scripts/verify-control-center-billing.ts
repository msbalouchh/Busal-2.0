import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { CONTROL_CENTER_BILLING_ROUTES } from "../src/modules/control-center/billing/constants/control-center-billing";
import {
  buildControlCenterOperatorContext,
  isControlCenterOperatorEmail,
} from "../src/modules/control-center/lib/resolve-control-center-authorization";
import {
  ensureBootstrapSubscriptionPlans,
  listSubscriptionPlans,
} from "../src/modules/control-center/billing/registry/subscription-plan-registry";
import {
  getControlCenterBillingManagementBundle,
  getControlCenterSubscriptionDetailBundle,
  queryControlCenterSubscriptions,
} from "../src/services/control-center-billing.service";
import { mapProfileToAuthUser } from "../src/services/user.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

async function main() {
  console.log("Control center billing module structure");
  const moduleFiles = [
    "src/modules/control-center/billing/index.ts",
    "src/modules/control-center/billing/types/control-center-billing-types.ts",
    "src/modules/control-center/billing/constants/control-center-billing.ts",
    "src/modules/control-center/billing/registry/subscription-plan-registry.ts",
    "src/modules/control-center/billing/registry/promotion-registry.ts",
    "src/modules/control-center/billing/lib/get-control-center-billing-context.ts",
    "src/modules/control-center/billing/actions/control-center-billing-actions.ts",
    "src/modules/control-center/billing/components/control-center-billing-hub.tsx",
    "src/modules/control-center/billing/components/control-center-subscription-detail.tsx",
    "src/modules/control-center/billing/components/billing-status-badge.tsx",
    "src/services/control-center-billing.service.ts",
    "src/app/control-center/(shell)/subscriptions/page.tsx",
    "src/app/control-center/(shell)/subscriptions/[businessId]/page.tsx",
  ];

  for (const file of moduleFiles) {
    read(file);
  }
  console.log("  PASS");

  console.log("Permission-aware guards");
  const contextLoader = read(
    "src/modules/control-center/billing/lib/get-control-center-billing-context.ts",
  );
  assert(contextLoader.includes("CONTROL_CENTER_SUBSCRIPTIONS"), "subscription guard missing");
  const actions = read(
    "src/modules/control-center/billing/actions/control-center-billing-actions.ts",
  );
  assert(actions.includes("protectedControlCenterAction"), "protectedControlCenterAction missing");
  assert(actions.includes("CONTROL_CENTER_BILLING_PLANS"), "plan action guard missing");
  assert(actions.includes("CONTROL_CENTER_BILLING_PROMOTIONS"), "promotion action guard missing");
  console.log("  PASS");

  console.log("Subscription plan registry");
  ensureBootstrapSubscriptionPlans();
  assert(listSubscriptionPlans().length > 0, "Plan registry empty");
  console.log("  PASS");

  console.log("Billing dashboard UI");
  const hub = read("src/modules/control-center/billing/components/control-center-billing-hub.tsx");
  assert(hub.includes("PlatformStatCard"), "dashboard widgets missing");
  assert(hub.includes("Subscription Plans"), "plan management missing");
  assert(hub.includes("Customer Subscriptions"), "subscription directory missing");
  assert(hub.includes("Billing Management"), "billing management missing");
  assert(hub.includes("Revenue Analytics"), "revenue analytics missing");
  assert(hub.includes("TenantConfirmDialog"), "confirmation dialogs missing");
  console.log("  PASS");

  console.log("Billing routes");
  assert(
    CONTROL_CENTER_BILLING_ROUTES.overview.startsWith("/control-center/subscriptions"),
    "Invalid route",
  );
  console.log("  PASS");

  console.log("Live control center billing workflow");
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "asc" },
    include: { owner: true },
  });
  assert(business?.owner, "No business owner found for verification");

  const user = mapProfileToAuthUser(business.owner.id, business.owner.email, business.owner, {});
  const operator = buildControlCenterOperatorContext(user);

  if (!isControlCenterOperatorEmail(user.email)) {
    console.log("  SKIP (non-operator email in non-production verification environment)");
  } else {
    const bundle = await getControlCenterBillingManagementBundle(operator);
    assert(bundle.permissions.canViewBilling, "View billing permission missing");
    assert(typeof bundle.widgets.mrrPence === "number", "MRR widget missing");
    assert(Array.isArray(bundle.plans), "Plans missing");
    assert(Array.isArray(bundle.recentPayments), "Recent payments missing");

    const directory = await queryControlCenterSubscriptions({ page: 1, pageSize: 5 });
    assert(typeof directory.total === "number", "Directory total missing");

    const tenantRecord = await prisma.tenantRecord.findFirst({
      orderBy: { createdAt: "asc" },
      select: { businessId: true },
    });
    assert(tenantRecord, "Tenant record missing");

    const detail = await getControlCenterSubscriptionDetailBundle(
      operator,
      tenantRecord.businessId,
    );
    assert(
      detail.subscription.businessId === tenantRecord.businessId,
      "Subscription detail missing",
    );
    console.log("  PASS");
  }

  console.log("\nControl center billing verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
