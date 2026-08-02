import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { installApp } from "../src/services/app-installation-manager.service";
import {
  ensureDefaultMarketplaceCatalog,
  listMarketplaceApps,
} from "../src/services/app-registry.service";
import { validateAppVersionChecksum } from "../src/services/app-version-manager.service";
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
  console.log("App Marketplace Platform module structure");
  const moduleFiles = [
    "src/modules/app-marketplace-management/index.ts",
    "src/services/app-registry.service.ts",
    "src/services/app-installation-manager.service.ts",
    "src/services/marketplace-manager.service.ts",
    "src/app/app/marketplace/page.tsx",
    "src/app/app/marketplace/store/page.tsx",
    "prisma/migrations/20250731180600_app_marketplace_platform/migration.sql",
    "prisma/migrations/20250731180700_app_marketplace_platform_permissions/migration.sql",
  ];

  for (const file of moduleFiles) read(file);

  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes(PERMISSION_CODES.MARKETPLACE_VIEW), "MARKETPLACE_VIEW missing");
  assert(permissions.includes(PERMISSION_CODES.MARKETPLACE_INSTALL), "MARKETPLACE_INSTALL missing");
  assert(permissions.includes(PERMISSION_CODES.MARKETPLACE_UPDATE), "MARKETPLACE_UPDATE missing");

  const schema = read("prisma/schema.prisma");
  assert(schema.includes("model PlatformMarketplaceApp"), "PlatformMarketplaceApp missing");
  assert(schema.includes("model PlatformInstalledApp"), "PlatformInstalledApp missing");

  const business = await prisma.business.findFirst({ select: { id: true, ownerId: true } });
  assert(business, "No business found");

  const profile = await getOwnedBusinessById(business.ownerId, business.id);
  assert(profile, "Business profile missing");

  const ownerId = business.ownerId;
  await ensureDefaultMarketplaceCatalog();
  const apps = await listMarketplaceApps();
  assert(apps.length > 0, "Catalog seed failed");

  const installed = await installApp(ownerId, apps[0]!.id);
  assert(installed?.id, "App installation failed");

  const checksum = await validateAppVersionChecksum(apps[0]!.id, apps[0]!.currentVersion);
  assert(checksum.valid, "Version checksum validation failed");

  console.log("App Marketplace Platform verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
