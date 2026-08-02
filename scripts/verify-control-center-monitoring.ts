import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { CONTROL_CENTER_MONITORING_ROUTES } from "../src/modules/control-center/monitoring/constants/control-center-monitoring";
import {
  buildControlCenterOperatorContext,
  isControlCenterOperatorEmail,
} from "../src/modules/control-center/lib/resolve-control-center-authorization";
import {
  getControlCenterMonitoringManagementBundle,
  queryControlCenterAlerts,
  queryControlCenterIncidents,
  queryControlCenterLogs,
} from "../src/services/control-center-monitoring.service";
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
  console.log("Control center monitoring module structure");
  const moduleFiles = [
    "src/modules/control-center/monitoring/index.ts",
    "src/modules/control-center/monitoring/types/control-center-monitoring-types.ts",
    "src/modules/control-center/monitoring/constants/control-center-monitoring.ts",
    "src/modules/control-center/monitoring/lib/get-control-center-monitoring-context.ts",
    "src/modules/control-center/monitoring/actions/control-center-monitoring-actions.ts",
    "src/modules/control-center/monitoring/components/control-center-monitoring-hub.tsx",
    "src/modules/control-center/monitoring/components/monitoring-status-badge.tsx",
    "src/services/control-center-monitoring.service.ts",
    "src/app/control-center/(shell)/monitoring/page.tsx",
  ];

  for (const file of moduleFiles) {
    read(file);
  }
  console.log("  PASS");

  console.log("Permission-aware guards");
  const contextLoader = read(
    "src/modules/control-center/monitoring/lib/get-control-center-monitoring-context.ts",
  );
  assert(contextLoader.includes("CONTROL_CENTER_MONITORING"), "monitoring guard missing");
  const actions = read(
    "src/modules/control-center/monitoring/actions/control-center-monitoring-actions.ts",
  );
  assert(actions.includes("protectedControlCenterAction"), "protectedControlCenterAction missing");
  assert(actions.includes("CONTROL_CENTER_MONITORING"), "monitoring action guard missing");
  console.log("  PASS");

  console.log("Granular monitoring permissions");
  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes("CONTROL_CENTER_MONITORING_LOGS"), "logs permission missing");
  assert(permissions.includes("CONTROL_CENTER_MONITORING_ALERTS"), "alerts permission missing");
  assert(
    permissions.includes("CONTROL_CENTER_MONITORING_INCIDENTS"),
    "incidents permission missing",
  );
  assert(
    permissions.includes("CONTROL_CENTER_MONITORING_INFRASTRUCTURE"),
    "infrastructure permission missing",
  );
  assert(permissions.includes("CONTROL_CENTER_MONITORING_AI"), "ai monitoring permission missing");
  console.log("  PASS");

  console.log("Monitoring dashboard UI");
  const hub = read(
    "src/modules/control-center/monitoring/components/control-center-monitoring-hub.tsx",
  );
  assert(hub.includes("PlatformStatCard"), "dashboard widgets missing");
  assert(hub.includes("Service Monitoring"), "service monitoring missing");
  assert(hub.includes("Infrastructure Monitoring"), "infrastructure monitoring missing");
  assert(hub.includes("API Monitoring"), "api monitoring missing");
  assert(hub.includes("AI Monitoring"), "ai monitoring missing");
  assert(hub.includes("Alerts"), "alerts missing");
  assert(hub.includes("Logs Explorer"), "logs explorer missing");
  assert(hub.includes("Incident Timeline"), "incident timeline missing");
  assert(hub.includes("Drawer"), "detail drawers missing");
  assert(hub.includes("MonitoringStatusBadge"), "status badges missing");
  assert(hub.includes("CONTROL_CENTER_MONITORING_REFRESH_MS"), "live refresh missing");
  console.log("  PASS");

  console.log("Monitoring routes");
  assert(
    CONTROL_CENTER_MONITORING_ROUTES.overview.startsWith("/control-center/monitoring"),
    "Invalid route",
  );
  console.log("  PASS");

  console.log("Live control center monitoring workflow");
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
    const bundle = await getControlCenterMonitoringManagementBundle(operator);
    assert(bundle.permissions.canViewMonitoring, "View monitoring permission missing");
    assert(typeof bundle.widgets.overallHealthScore === "number", "Health score widget missing");
    assert(Array.isArray(bundle.services), "Service monitoring missing");
    assert(Array.isArray(bundle.alerts.items), "Alerts missing");
    assert(Array.isArray(bundle.logs.items), "Logs missing");
    assert(Array.isArray(bundle.incidents.items), "Incidents missing");

    const alerts = await queryControlCenterAlerts({ page: 1, pageSize: 5 });
    assert(typeof alerts.total === "number", "Alert total missing");

    const logs = await queryControlCenterLogs({ page: 1, pageSize: 5 });
    assert(typeof logs.total === "number", "Log total missing");

    const incidents = await queryControlCenterIncidents({ page: 1, pageSize: 5 });
    assert(typeof incidents.total === "number", "Incident total missing");

    console.log("  PASS");
  }

  console.log("\nControl center monitoring verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
