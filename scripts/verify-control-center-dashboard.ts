import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { CONTROL_CENTER_ROUTES } from "../src/modules/control-center/constants/routes";
import { getControlCenterNavigationRegistry } from "../src/modules/control-center/constants/navigation";
import {
  buildControlCenterOperatorContext,
  isControlCenterOperatorEmail,
} from "../src/modules/control-center/lib/resolve-control-center-authorization";
import { filterControlCenterNavigation } from "../src/modules/control-center/lib/filter-control-center-navigation";
import { getControlCenterPlatformBundle } from "../src/services/control-center-module.service";
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
  console.log("Control center dashboard module structure");
  const moduleFiles = [
    "src/modules/control-center/index.ts",
    "src/modules/control-center/types/control-center-types.ts",
    "src/modules/control-center/constants/routes.ts",
    "src/modules/control-center/constants/navigation.ts",
    "src/modules/control-center/constants/navigation-items.ts",
    "src/modules/control-center/guards/control-center.guards.ts",
    "src/modules/control-center/lib/get-control-center-context.ts",
    "src/modules/control-center/lib/filter-control-center-navigation.ts",
    "src/modules/control-center/lib/resolve-control-center-authorization.ts",
    "src/modules/control-center/components/control-center-provider.tsx",
    "src/modules/control-center/components/control-center-shell.tsx",
    "src/modules/control-center/components/control-center-sidebar.tsx",
    "src/modules/control-center/components/control-center-header.tsx",
    "src/modules/control-center/components/control-center-dashboard.tsx",
    "src/modules/control-center/components/dashboard/platform-stat-card.tsx",
    "src/modules/control-center/components/dashboard/health-card.tsx",
    "src/modules/control-center/components/dashboard/alert-card.tsx",
    "src/modules/control-center/components/dashboard/incident-card.tsx",
    "src/modules/control-center/components/dashboard/revenue-card.tsx",
    "src/modules/control-center/components/dashboard/usage-card.tsx",
    "src/modules/control-center/components/dashboard/platform-activity-feed.tsx",
    "src/modules/control-center/components/dashboard/tenant-summary-card.tsx",
    "src/modules/control-center/components/dashboard/quick-action-card.tsx",
    "src/modules/control-center/components/dashboard/dashboard-grid.tsx",
    "src/modules/control-center/components/dashboard/section-header.tsx",
    "src/modules/control-center/components/dashboard/loading-skeleton.tsx",
    "src/modules/control-center/components/dashboard/empty-state.tsx",
    "src/modules/control-center/components/dashboard/error-state.tsx",
    "src/modules/control-center/components/dashboard/widget-container.tsx",
    "src/services/control-center-module.service.ts",
    "src/app/control-center/layout.tsx",
    "src/app/control-center/(shell)/layout.tsx",
    "src/app/control-center/(shell)/page.tsx",
    "src/app/control-center/(shell)/[section]/page.tsx",
    "src/app/control-center/unauthorized/page.tsx",
  ];

  for (const file of moduleFiles) {
    read(file);
  }
  console.log("  PASS");

  console.log("Super admin authentication guards");
  const guards = read("src/modules/control-center/guards/control-center.guards.ts");
  assert(guards.includes("requireControlCenterSession"), "requireControlCenterSession missing");
  assert(guards.includes("protectedControlCenterPage"), "protectedControlCenterPage missing");
  assert(guards.includes("CONTROL_CENTER_ROUTES.unauthorized"), "unauthorized redirect missing");
  console.log("  PASS");

  console.log("Navigation registry and extensibility");
  const navigation = read("src/modules/control-center/constants/navigation.ts");
  assert(
    navigation.includes("registerControlCenterNavGroup"),
    "registerControlCenterNavGroup missing",
  );
  assert(navigation.includes("registerControlCenterWidget"), "registerControlCenterWidget missing");
  assert(getControlCenterNavigationRegistry().length > 0, "Navigation registry empty");
  console.log("  PASS");

  console.log("Permission-aware filtering");
  const filterNavigation = read(
    "src/modules/control-center/lib/filter-control-center-navigation.ts",
  );
  assert(
    filterNavigation.includes("filterControlCenterNavigation"),
    "filterControlCenterNavigation missing",
  );
  assert(filterNavigation.includes("hasPermission"), "permission checks missing");
  console.log("  PASS");

  console.log("Control center routes");
  for (const route of Object.values(CONTROL_CENTER_ROUTES)) {
    assert(route.startsWith("/control-center"), `Invalid route: ${route}`);
  }
  console.log("  PASS");

  console.log("Shell layout wiring");
  const shellLayout = read("src/app/control-center/(shell)/layout.tsx");
  assert(shellLayout.includes("ControlCenterProvider"), "ControlCenterProvider missing");
  assert(shellLayout.includes("ControlCenterShell"), "ControlCenterShell missing");
  const shell = read("src/modules/control-center/components/control-center-shell.tsx");
  assert(shell.includes("data-utility-panel"), "utility panel missing");
  assert(shell.includes("ControlCenterSidebar"), "sidebar missing");
  console.log("  PASS");

  console.log("Header integrations");
  const header = read("src/modules/control-center/components/control-center-header.tsx");
  assert(header.includes("GlobalSearchTrigger"), "GlobalSearchTrigger missing");
  assert(header.includes("NotificationCenterTrigger"), "NotificationCenterTrigger missing");
  assert(header.includes("ThemeToggle"), "ThemeToggle missing");
  assert(header.includes("LanguageSelector"), "LanguageSelector missing");
  assert(header.includes("ProfileMenu"), "ProfileMenu missing");
  console.log("  PASS");

  console.log("Dashboard widgets");
  const dashboard = read("src/modules/control-center/components/control-center-dashboard.tsx");
  assert(dashboard.includes("PlatformStatCard"), "PlatformStatCard missing");
  assert(dashboard.includes("HealthCard"), "HealthCard missing");
  assert(dashboard.includes("WidgetContainer"), "WidgetContainer missing");
  assert(dashboard.includes("dynamic("), "lazy loading missing");
  console.log("  PASS");

  console.log("Live control center platform bundle");
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "asc" },
    include: { owner: true },
  });
  assert(business?.owner, "No business owner found for verification");

  const user = mapProfileToAuthUser(business.owner.id, business.owner.email, business.owner, {});
  const operatorContext = buildControlCenterOperatorContext(user);

  if (!isControlCenterOperatorEmail(user.email)) {
    console.log("  SKIP (non-operator email in non-production verification environment)");
  } else {
    assert(operatorContext.isOperator, "Operator context should be authorized");
    const filteredNav = filterControlCenterNavigation(operatorContext.permissions);
    assert(filteredNav.length > 0, "Filtered navigation empty for operator");

    const bundle = await getControlCenterPlatformBundle();
    assert(typeof bundle.widgets.totalTenants === "number", "Total tenants widget missing");
    assert(typeof bundle.widgets.mrrPence === "number", "MRR widget missing");
    assert(Array.isArray(bundle.activity), "Activity feed missing");
    assert(Array.isArray(bundle.tenantSummaries), "Tenant summaries missing");
    console.log("  PASS");
  }

  console.log("\nControl center dashboard verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
