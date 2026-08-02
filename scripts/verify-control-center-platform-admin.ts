import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { CONTROL_CENTER_PLATFORM_ADMIN_ROUTES } from "../src/modules/control-center/platform-admin/constants/control-center-platform-admin";
import {
  buildControlCenterOperatorContext,
  isControlCenterOperatorEmail,
} from "../src/modules/control-center/lib/resolve-control-center-authorization";
import {
  getControlCenterPlatformAdminManagementBundle,
  queryControlCenterFeatureFlags,
  queryControlCenterReleases,
} from "../src/services/control-center-platform-admin.service";
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
  console.log("Control center platform admin module structure");
  const moduleFiles = [
    "src/modules/control-center/platform-admin/index.ts",
    "src/modules/control-center/platform-admin/types/control-center-platform-admin-types.ts",
    "src/modules/control-center/platform-admin/constants/control-center-platform-admin.ts",
    "src/modules/control-center/platform-admin/lib/get-control-center-platform-admin-context.ts",
    "src/modules/control-center/platform-admin/lib/platform-admin-utils.ts",
    "src/modules/control-center/platform-admin/lib/platform-admin-registry.ts",
    "src/modules/control-center/platform-admin/lib/build-operator-platform-context.ts",
    "src/modules/control-center/platform-admin/actions/control-center-platform-admin-actions.ts",
    "src/modules/control-center/platform-admin/components/control-center-platform-admin-hub.tsx",
    "src/modules/control-center/platform-admin/components/platform-admin-status-badge.tsx",
    "src/services/control-center-platform-admin.service.ts",
    "src/app/control-center/(shell)/platform-settings/page.tsx",
    "src/app/control-center/(shell)/feature-flags/page.tsx",
    "src/app/control-center/(shell)/release-management/page.tsx",
    "src/app/control-center/(shell)/system-maintenance/page.tsx",
    "src/app/control-center/(shell)/staff/page.tsx",
    "src/app/control-center/(shell)/audit-logs/page.tsx",
    "src/app/control-center/(shell)/analytics/page.tsx",
  ];

  for (const file of moduleFiles) {
    read(file);
  }
  console.log("  PASS");

  console.log("Permission-aware guards");
  const contextLoader = read(
    "src/modules/control-center/platform-admin/lib/get-control-center-platform-admin-context.ts",
  );
  assert(contextLoader.includes("CONTROL_CENTER_SETTINGS"), "settings guard missing");
  assert(contextLoader.includes("CONTROL_CENTER_FEATURE_FLAGS"), "feature flags guard missing");
  const actions = read(
    "src/modules/control-center/platform-admin/actions/control-center-platform-admin-actions.ts",
  );
  assert(actions.includes("protectedControlCenterAction"), "protectedControlCenterAction missing");
  assert(actions.includes("CONTROL_CENTER_RELEASES"), "release action guard missing");
  console.log("  PASS");

  console.log("Governance permissions");
  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes("CONTROL_CENTER_SETTINGS"), "settings permission missing");
  assert(permissions.includes("CONTROL_CENTER_MAINTENANCE"), "maintenance permission missing");
  assert(permissions.includes("CONTROL_CENTER_RELEASES"), "releases permission missing");
  assert(permissions.includes("CONTROL_CENTER_FEATURE_FLAGS"), "feature flags permission missing");
  assert(permissions.includes("CONTROL_CENTER_AUDIT"), "audit permission missing");
  assert(permissions.includes("CONTROL_CENTER_ANALYTICS"), "analytics permission missing");
  console.log("  PASS");

  console.log("Platform administration UI");
  const hub = read(
    "src/modules/control-center/platform-admin/components/control-center-platform-admin-hub.tsx",
  );
  assert(hub.includes("PlatformStatCard"), "dashboard widgets missing");
  assert(hub.includes("Global Platform Settings"), "settings section missing");
  assert(hub.includes("Feature Flag Management"), "feature flags missing");
  assert(hub.includes("Release Management"), "release management missing");
  assert(hub.includes("Environment Management"), "environment management missing");
  assert(hub.includes("System Maintenance"), "maintenance missing");
  assert(hub.includes("Platform Staff"), "staff missing");
  assert(hub.includes("Global Audit"), "audit missing");
  assert(hub.includes("Platform Analytics"), "analytics missing");
  assert(hub.includes("Drawer"), "detail drawers missing");
  assert(hub.includes("PlatformAdminStatusBadge"), "status badges missing");
  assert(hub.includes("TenantConfirmDialog"), "confirmation dialogs missing");
  assert(hub.includes("TrendBars"), "charts missing");
  console.log("  PASS");

  console.log("Platform admin routes");
  assert(
    CONTROL_CENTER_PLATFORM_ADMIN_ROUTES.settings.startsWith("/control-center/platform-settings"),
    "Invalid settings route",
  );
  assert(
    CONTROL_CENTER_PLATFORM_ADMIN_ROUTES.featureFlags.startsWith("/control-center/feature-flags"),
    "Invalid feature flags route",
  );
  console.log("  PASS");

  console.log("Extensibility registry");
  const registry = read("src/modules/control-center/platform-admin/lib/platform-admin-registry.ts");
  assert(registry.includes("registerPlatformAdminModule"), "registry extension missing");
  console.log("  PASS");

  console.log("Live control center platform admin workflow");
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
    const bundle = await getControlCenterPlatformAdminManagementBundle(operator);
    assert(bundle.permissions.canViewSettings, "View settings permission missing");
    assert(typeof bundle.widgets.activeTenants === "number", "Active tenants widget missing");
    assert(Array.isArray(bundle.settings), "Settings missing");
    assert(Array.isArray(bundle.featureFlags.items), "Feature flags missing");
    assert(Array.isArray(bundle.releases.items), "Releases missing");
    assert(Array.isArray(bundle.environments), "Environments missing");
    assert(Array.isArray(bundle.modules), "Modules missing");
    assert(Array.isArray(bundle.staff), "Staff missing");
    assert(Array.isArray(bundle.audit.items), "Audit missing");

    const flags = await queryControlCenterFeatureFlags({ page: 1, pageSize: 5 });
    assert(typeof flags.total === "number", "Feature flag total missing");

    const releases = await queryControlCenterReleases({ page: 1, pageSize: 5 });
    assert(typeof releases.total === "number", "Release total missing");

    console.log("  PASS");
  }

  console.log("\nControl center platform admin verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
