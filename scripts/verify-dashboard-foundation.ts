import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

function main() {
  console.log("Dashboard foundation module structure");
  const moduleFiles = [
    "src/modules/dashboard/index.ts",
    "src/modules/dashboard/types/dashboard.ts",
    "src/modules/dashboard/constants/navigation.ts",
    "src/modules/dashboard/lib/filter-navigation.ts",
    "src/modules/dashboard/lib/get-dashboard-shell-context.ts",
    "src/modules/dashboard/lib/get-dashboard-home-data.ts",
    "src/modules/dashboard/lib/resolve-navigation-feature-flags.ts",
    "src/modules/dashboard/lib/serialize-dashboard-context.ts",
    "src/modules/dashboard/components/dashboard-provider.tsx",
    "src/modules/dashboard/components/dashboard-home.tsx",
    "src/modules/dashboard/components/dashboard-card.tsx",
    "src/modules/dashboard/components/stat-card.tsx",
    "src/modules/dashboard/components/widget-container.tsx",
    "src/modules/dashboard/components/header/global-search-trigger.tsx",
    "src/components/layout/dashboard-shell.tsx",
    "src/components/layout/sidebar.tsx",
    "src/components/layout/header.tsx",
    "src/app/dashboard/layout.tsx",
    "src/app/dashboard/page.tsx",
  ];

  for (const file of moduleFiles) {
    read(file);
  }
  console.log("  PASS");

  console.log("Navigation registry");
  const navigation = read("src/modules/dashboard/constants/navigation.ts");
  assert(navigation.includes("DASHBOARD_NAV_GROUPS"), "DASHBOARD_NAV_GROUPS missing");
  assert(navigation.includes("registerDashboardNavGroup"), "registerDashboardNavGroup missing");
  assert(navigation.includes("featureFlag"), "feature flag metadata missing");
  assert(navigation.includes("permission"), "permission metadata missing");
  console.log("  PASS");

  console.log("Permission-aware filtering");
  const filterNavigation = read("src/modules/dashboard/lib/filter-navigation.ts");
  assert(
    filterNavigation.includes("filterDashboardNavigation"),
    "filterDashboardNavigation missing",
  );
  assert(filterNavigation.includes("hasPermission"), "permission checks missing");
  console.log("  PASS");

  console.log("Dashboard layout wiring");
  const layout = read("src/app/dashboard/layout.tsx");
  assert(layout.includes("DashboardProvider"), "DashboardProvider missing in layout");
  assert(layout.includes("BusinessContextProvider"), "BusinessContextProvider missing in layout");
  assert(layout.includes("DashboardShell"), "DashboardShell missing in layout");
  console.log("  PASS");

  console.log("Header integrations");
  const header = read("src/components/layout/header.tsx");
  assert(header.includes("GlobalSearchTrigger"), "GlobalSearchTrigger missing");
  assert(header.includes("NotificationCenterTrigger"), "NotificationCenterTrigger missing");
  assert(header.includes("ProfileMenu"), "ProfileMenu missing");
  assert(header.includes("LanguageSelector"), "LanguageSelector missing");
  assert(header.includes("ThemeToggle"), "ThemeToggle missing");
  console.log("  PASS");

  console.log("Responsive shell");
  const shell = read("src/components/layout/dashboard-shell.tsx");
  assert(shell.includes("Sidebar"), "Sidebar missing in shell");
  assert(shell.includes("footer"), "footer missing in shell");
  assert(shell.includes("data-utility-panel"), "utility panel missing in shell");
  console.log("  PASS");

  console.log("Dashboard home widgets");
  const home = read("src/modules/dashboard/components/dashboard-home.tsx");
  assert(home.includes("StatCard"), "StatCard missing in dashboard home");
  assert(home.includes("ActivityTimeline"), "ActivityTimeline missing in dashboard home");
  assert(home.includes("QuickActionCard"), "QuickActionCard missing in dashboard home");
  assert(home.includes("WidgetContainer"), "WidgetContainer missing in dashboard home");
  console.log("  PASS");

  console.log("Theme support");
  const themeToggle = read("src/components/layout/theme-toggle.tsx");
  assert(themeToggle.includes('"system"'), "system theme option missing");
  console.log("  PASS");

  console.log("\nDashboard foundation verification passed.");
}

main();
