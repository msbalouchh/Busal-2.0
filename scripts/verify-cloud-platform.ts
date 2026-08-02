import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { getCloudDashboardOverview } from "../src/services/platform-provisioning.service";
import { validateTenantLicense } from "../src/services/license-manager.service";
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
  console.log("Cloud Platform module structure");
  for (const file of [
    "src/modules/cloud-platform-management/index.ts",
    "src/services/tenant-provisioning.service.ts",
    "src/services/subscription-manager.service.ts",
    "src/services/plan-manager.service.ts",
    "src/app/app/cloud/page.tsx",
    "prisma/migrations/20250731181200_cloud_platform/migration.sql",
    "prisma/migrations/20250731181300_cloud_platform_permissions/migration.sql",
  ])
    read(file);

  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes(PERMISSION_CODES.CLOUD_VIEW), "CLOUD_VIEW missing");
  assert(permissions.includes(PERMISSION_CODES.SUBSCRIPTION_MANAGE), "SUBSCRIPTION_MANAGE missing");
  assert(permissions.includes(PERMISSION_CODES.LICENSE_MANAGE), "LICENSE_MANAGE missing");

  const schema = read("prisma/schema.prisma");
  assert(schema.includes("model PlatformCloudTenant"), "PlatformCloudTenant missing");
  assert(
    schema.includes("model PlatformCloudSubscriptionPlan"),
    "PlatformCloudSubscriptionPlan missing",
  );

  const business = await prisma.business.findFirst({ select: { id: true, ownerId: true } });
  assert(business, "No business found");
  assert(await getOwnedBusinessById(business.ownerId, business.id), "Business profile missing");

  const overview = await getCloudDashboardOverview(business.ownerId);
  assert(overview.tenant.id, "Tenant provisioning failed");

  const license = await validateTenantLicense(business.ownerId);
  assert(license.valid, "License validation failed");

  console.log("Cloud Platform verification passed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
