import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { getObservabilityDashboardOverview } from "../src/services/observability-platform-manager.service";
import { recordMetric } from "../src/services/platform-metrics.service";
import { writePlatformLog, validateLogIntegrity } from "../src/services/platform-logging.service";
import { validateAlertCondition } from "../src/services/platform-alert-manager.service";
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
  console.log("Observability Platform module structure");
  const moduleFiles = [
    "src/modules/observability-platform-management/index.ts",
    "src/services/platform-metrics.service.ts",
    "src/services/platform-logging.service.ts",
    "src/services/platform-tracing.service.ts",
    "src/services/platform-alert-manager.service.ts",
    "src/services/platform-incident-manager.service.ts",
    "src/services/platform-health-monitor.service.ts",
    "src/services/platform-performance-monitor.service.ts",
    "src/services/platform-audit-aggregator.service.ts",
    "src/services/platform-observability-notification.service.ts",
    "src/services/observability-platform-manager.service.ts",
    "src/app/app/observability/page.tsx",
    "src/app/app/observability/metrics/page.tsx",
    "prisma/migrations/20250731180800_observability_platform/migration.sql",
    "prisma/migrations/20250731180900_observability_platform_permissions/migration.sql",
  ];

  for (const file of moduleFiles) read(file);

  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes(PERMISSION_CODES.OBSERVABILITY_VIEW), "OBSERVABILITY_VIEW missing");
  assert(
    permissions.includes(PERMISSION_CODES.OBSERVABILITY_MANAGE),
    "OBSERVABILITY_MANAGE missing",
  );
  assert(permissions.includes(PERMISSION_CODES.INCIDENT_MANAGE), "INCIDENT_MANAGE missing");
  assert(permissions.includes(PERMISSION_CODES.LOGS_VIEW), "LOGS_VIEW missing");
  assert(permissions.includes(PERMISSION_CODES.ALERTS_MANAGE), "ALERTS_MANAGE missing");

  const schema = read("prisma/schema.prisma");
  assert(schema.includes("model PlatformMetric"), "PlatformMetric missing");
  assert(schema.includes("model PlatformLog"), "PlatformLog missing");
  assert(schema.includes("model PlatformIncident"), "PlatformIncident missing");
  assert(schema.includes("model PlatformAlert"), "PlatformAlert missing");

  assert(validateAlertCondition("error_rate > 5%").valid, "Alert validation failed");

  const business = await prisma.business.findFirst({ select: { id: true, ownerId: true } });
  assert(business, "No business found");

  const profile = await getOwnedBusinessById(business.ownerId, business.id);
  assert(profile, "Business profile missing");

  const ownerId = business.ownerId;
  await recordMetric(ownerId, {
    service: "observability-platform",
    metric: "verify.test",
    value: 1,
    unit: "count",
  });

  const log = await writePlatformLog(ownerId, {
    service: "observability-platform",
    message: "Verification log entry",
    category: "verify",
  });

  const integrity = validateLogIntegrity(log, business.id, "Verification log entry");
  assert(integrity, "Log integrity check failed");

  const overview = await getObservabilityDashboardOverview(ownerId);
  assert(overview.systemHealth, "Dashboard overview missing system health");

  console.log("Observability Platform verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
