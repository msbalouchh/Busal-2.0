import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import {
  createIntegrationConnection,
  testIntegrationConnection,
} from "../src/services/integration-connection-manager.service";
import { getIntegrationHealthSnapshot } from "../src/services/integration-health-monitor.service";
import {
  ensureIntegrationProvidersBootstrapped,
  listIntegrationProviders,
} from "../src/services/integration-registry.service";
import { triggerManualSync } from "../src/services/integration-sync-manager.service";
import { encryptCredentials } from "../src/services/integration-credential-crypto.service";
import { getOwnedBusinessById } from "../src/services/business-profile.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

async function main() {
  console.log("Integration Platform module structure");
  const moduleFiles = [
    "src/modules/integration-platform-management/index.ts",
    "src/modules/integration-platform-management/constants/routes.ts",
    "src/modules/integration-platform-management/types/integration-platform-types.ts",
    "src/modules/integration-platform-management/lib/get-integration-platform-context.ts",
    "src/modules/integration-platform-management/lib/integration-platform-validation.ts",
    "src/modules/integration-platform-management/actions/integration-platform-actions.ts",
    "src/modules/integration-platform-management/plugins/bootstrap-integration-providers.ts",
    "src/services/integration-context.service.ts",
    "src/services/integration-registry.service.ts",
    "src/services/integration-provider-registry.service.ts",
    "src/services/integration-connection-manager.service.ts",
    "src/services/integration-credential-crypto.service.ts",
    "src/services/integration-credential-manager.service.ts",
    "src/services/integration-webhook-manager.service.ts",
    "src/services/integration-sync-manager.service.ts",
    "src/services/integration-event-dispatcher.service.ts",
    "src/services/integration-retry-queue.service.ts",
    "src/services/integration-health-monitor.service.ts",
    "src/services/integration-logger.service.ts",
    "src/services/integration-platform-permission.service.ts",
    "src/services/integrations/interfaces/payment-provider.interface.ts",
    "src/app/app/integrations/page.tsx",
    "src/app/app/integrations/providers/page.tsx",
    "src/app/app/integrations/connections/page.tsx",
    "src/app/app/integrations/connections/new/page.tsx",
    "src/app/app/integrations/connections/[connectionId]/page.tsx",
    "src/app/app/integrations/webhooks/page.tsx",
    "src/app/app/integrations/sync/page.tsx",
    "src/app/app/integrations/logs/page.tsx",
    "src/app/app/integrations/health/page.tsx",
    "src/app/app/integrations/search/page.tsx",
    "prisma/migrations/20250731150000_integration_platform/migration.sql",
    "prisma/migrations/20250731150100_integration_platform_permissions/migration.sql",
  ];

  for (const file of moduleFiles) {
    read(file);
  }

  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes(PERMISSION_CODES.INTEGRATION_VIEW), "INTEGRATION_VIEW missing");
  assert(permissions.includes(PERMISSION_CODES.INTEGRATION_CREATE), "INTEGRATION_CREATE missing");
  assert(permissions.includes(PERMISSION_CODES.INTEGRATION_UPDATE), "INTEGRATION_UPDATE missing");
  assert(permissions.includes(PERMISSION_CODES.INTEGRATION_DELETE), "INTEGRATION_DELETE missing");
  assert(permissions.includes(PERMISSION_CODES.INTEGRATION_MANAGE), "INTEGRATION_MANAGE missing");

  const schema = read("prisma/schema.prisma");
  assert(schema.includes("model IntegrationProvider"), "IntegrationProvider model missing");
  assert(schema.includes("model IntegrationConnection"), "IntegrationConnection model missing");
  assert(schema.includes("model IntegrationWebhook"), "IntegrationWebhook model missing");

  const encrypted = encryptCredentials(JSON.stringify({ apiKey: "test-key" }));
  assert(encrypted.includes(":"), "Credential encryption failed");

  const business = await prisma.business.findFirst({ select: { id: true, ownerId: true } });
  assert(business, "No business found for integration test");

  const profile = await getOwnedBusinessById(business.ownerId, business.id);
  assert(profile, "Business profile missing");

  const ownerId = business.ownerId;
  await ensureIntegrationProvidersBootstrapped(ownerId);
  const providers = await listIntegrationProviders(ownerId);
  assert(providers.length >= 16, "Provider bootstrap failed");

  const health = await getIntegrationHealthSnapshot(ownerId);
  assert(typeof health.healthScore === "number", "Health snapshot failed");

  const stripe = providers.find((p) => p.slug === "stripe");
  assert(stripe, "Stripe placeholder missing");

  const connection = await createIntegrationConnection(ownerId, {
    providerId: stripe.id,
    displayName: "Test Stripe Connection",
    credentials: { apiKey: "sk_test_placeholder" },
  });
  assert(connection.id, "Connection creation failed");

  const test = await testIntegrationConnection(ownerId, connection.id);
  assert(test.success, "Connection test failed");

  const sync = await triggerManualSync(ownerId, connection.id);
  assert(sync.id, "Manual sync failed");

  console.log("Integration Platform verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
