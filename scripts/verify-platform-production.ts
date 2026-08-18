import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PLATFORM_API_SCOPES, hasRequiredScopes } from "../src/modules/platform/constants/api-scopes";
import { checkRateLimit } from "../src/modules/api-gateway/engine/rate-limit-engine";
import { resolvePlatformEntitlements } from "../src/modules/platform/services/platform-entitlements.service";
import { verifyEmbedToken, signEmbedToken } from "../src/modules/platform/services/platform-embed.service";
import { verifyIncomingWebhookSignature } from "../src/modules/platform/services/platform-webhook-delivery.service";
import { listV1ApiRoutes } from "../src/modules/platform/api/v1/router";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

async function main() {
  console.log("Platform production verification");

  const requiredFiles = [
    "src/modules/platform/services/platform-api-rate-limit.service.ts",
    "src/modules/platform/api/v1/platform-api-handler.ts",
    "src/modules/platform/services/platform-domain-verification.service.ts",
    "src/modules/platform/services/platform-webhook-delivery.service.ts",
    "src/modules/platform/components/platform-auth-shell.tsx",
    "src/app/embed/menu/page.tsx",
    "src/app/embed/booking/page.tsx",
    "src/app/app/developer/docs/page.tsx",
    "src/app/.well-known/busal-verification.txt/route.ts",
  ];

  for (const file of requiredFiles) read(file);

  assert(PLATFORM_API_SCOPES.CUSTOMERS_READ === "customers:read", "scope mismatch");
  assert(hasRequiredScopes(["customers:read", "orders:read"], ["customers:read"]), "scope check failed");
  assert(!hasRequiredScopes(["customers:read"], ["orders:read"]), "scope negative check failed");

  const rate = checkRateLimit({
    scope: "BUSINESS",
    scopeIdentifier: "biz",
    requestsPerMinute: 10,
    burstLimit: 2,
    currentCount: 10,
  });
  assert(!rate.allowed, "rate limit should block");

  const entitlements = resolvePlatformEntitlements("busal-growth");
  assert(entitlements.whiteLabel, "growth should include white-label");
  assert(!entitlements.embed, "growth should not include embed");

  const routes = listV1ApiRoutes();
  assert(routes.some((route) => route.path.includes("/staff")), "staff route missing");
  assert(routes.some((route) => route.path.includes("/analytics")), "analytics route missing");

  const dashboardRoutes = [
    "src/app/dashboard/page.tsx",
    "src/app/dashboard/business/page.tsx",
    "src/app/dashboard/crm/page.tsx",
    "src/app/dashboard/customers/page.tsx",
    "src/app/dashboard/menu/page.tsx",
    "src/app/dashboard/tables/page.tsx",
    "src/app/dashboard/reservations/page.tsx",
    "src/app/dashboard/restaurant/orders/page.tsx",
    "src/app/dashboard/kitchen/page.tsx",
    "src/app/dashboard/pos/page.tsx",
    "src/app/dashboard/inventory/page.tsx",
    "src/app/dashboard/staff/page.tsx",
    "src/app/dashboard/revops/page.tsx",
    "src/app/dashboard/payments/page.tsx",
    "src/app/dashboard/receipts/page.tsx",
    "src/app/dashboard/qr-menu/page.tsx",
    "src/app/dashboard/reporting/page.tsx",
    "src/app/dashboard/notifications/page.tsx",
    "src/app/dashboard/settings/page.tsx",
    "src/app/dashboard/ai-platform/assistant/page.tsx",
    "src/app/dashboard/tenant-platform/white-label/page.tsx",
    "src/app/(marketing)/pricing/page.tsx",
    "src/app/app/developer/docs/page.tsx",
    "src/app/app/developer/keys/page.tsx",
    "src/modules/commercial-foundation/services/subscription-access.service.ts",
  ];

  for (const file of dashboardRoutes) read(file);

  const coreEntitlements = resolvePlatformEntitlements("busal-core");
  assert(!coreEntitlements.whiteLabel, "core should not include white-label");
  assert(!coreEntitlements.customDomain, "core should not include custom domain");

  const proEntitlements = resolvePlatformEntitlements("busal-pro");
  assert(proEntitlements.customDomain, "pro should include custom domain");
  assert(proEntitlements.webhooks, "pro should include webhooks");

  const enterpriseEntitlements = resolvePlatformEntitlements("busal-enterprise");
  assert(enterpriseEntitlements.embed, "enterprise should include embed");

  const token = signEmbedToken({
    businessId: "test-business",
    widgetType: "menu",
    origin: "https://example.com",
    issuedAt: Date.now(),
    expiresAt: Date.now() + 60_000,
  });
  assert(token, "embed token should be created");
  const verified = verifyEmbedToken(token);
  assert(verified?.businessId === "test-business", "embed token verification failed");

  const signature = verifyIncomingWebhookSignature("{}", "invalid", "secret");
  assert(signature === false, "invalid webhook signature should fail");

  const businessCount = await prisma.business.count();
  assert(businessCount >= 0, "database unavailable");

  console.log("Platform production verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
