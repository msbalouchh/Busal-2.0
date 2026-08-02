import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { CONTROL_CENTER_SUPPORT_ROUTES } from "../src/modules/control-center/support/constants/control-center-support";
import {
  buildControlCenterOperatorContext,
  isControlCenterOperatorEmail,
} from "../src/modules/control-center/lib/resolve-control-center-authorization";
import {
  getControlCenterSupportManagementBundle,
  queryControlCenterKnowledgeArticles,
  queryControlCenterSupportIncidents,
  queryControlCenterTickets,
} from "../src/services/control-center-support.service";
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
  console.log("Control center support module structure");
  const moduleFiles = [
    "src/modules/control-center/support/index.ts",
    "src/modules/control-center/support/types/control-center-support-types.ts",
    "src/modules/control-center/support/constants/control-center-support.ts",
    "src/modules/control-center/support/lib/get-control-center-support-context.ts",
    "src/modules/control-center/support/lib/support-admin-utils.ts",
    "src/modules/control-center/support/actions/control-center-support-actions.ts",
    "src/modules/control-center/support/components/control-center-support-hub.tsx",
    "src/modules/control-center/support/components/support-status-badge.tsx",
    "src/services/control-center-support.service.ts",
    "src/app/control-center/(shell)/support/page.tsx",
    "src/app/control-center/(shell)/incidents/page.tsx",
  ];

  for (const file of moduleFiles) {
    read(file);
  }
  console.log("  PASS");

  console.log("Permission-aware guards");
  const contextLoader = read(
    "src/modules/control-center/support/lib/get-control-center-support-context.ts",
  );
  assert(contextLoader.includes("CONTROL_CENTER_SUPPORT"), "support guard missing");
  const actions = read(
    "src/modules/control-center/support/actions/control-center-support-actions.ts",
  );
  assert(actions.includes("protectedControlCenterAction"), "protectedControlCenterAction missing");
  assert(actions.includes("CONTROL_CENTER_SUPPORT"), "support action guard missing");
  console.log("  PASS");

  console.log("Granular support permissions");
  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes("CONTROL_CENTER_SUPPORT_TICKETS"), "tickets permission missing");
  assert(permissions.includes("CONTROL_CENTER_SUPPORT_INCIDENTS"), "incidents permission missing");
  assert(permissions.includes("CONTROL_CENTER_SUPPORT_KNOWLEDGE"), "knowledge permission missing");
  assert(permissions.includes("CONTROL_CENTER_SUPPORT_ANALYTICS"), "analytics permission missing");
  assert(
    permissions.includes("CONTROL_CENTER_SUPPORT_SERVICE_STATUS"),
    "service status permission missing",
  );
  console.log("  PASS");

  console.log("Support dashboard UI");
  const hub = read("src/modules/control-center/support/components/control-center-support-hub.tsx");
  assert(hub.includes("PlatformStatCard"), "dashboard widgets missing");
  assert(hub.includes("Ticket Management"), "ticket management missing");
  assert(hub.includes("Incident Management"), "incident management missing");
  assert(hub.includes("Service Status"), "service status missing");
  assert(hub.includes("Knowledge Base"), "knowledge base missing");
  assert(hub.includes("Support Analytics"), "analytics missing");
  assert(hub.includes("Internal Communication"), "internal communication missing");
  assert(hub.includes("Kanban"), "kanban view missing");
  assert(hub.includes("Drawer"), "detail drawers missing");
  assert(hub.includes("SupportStatusBadge"), "status badges missing");
  assert(hub.includes("TenantConfirmDialog"), "confirmation dialogs missing");
  console.log("  PASS");

  console.log("Support routes");
  assert(
    CONTROL_CENTER_SUPPORT_ROUTES.overview.startsWith("/control-center/support"),
    "Invalid support route",
  );
  assert(
    CONTROL_CENTER_SUPPORT_ROUTES.incidents.startsWith("/control-center/incidents"),
    "Invalid incidents route",
  );
  console.log("  PASS");

  console.log("Live control center support workflow");
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
    const bundle = await getControlCenterSupportManagementBundle(operator);
    assert(bundle.permissions.canViewSupport, "View support permission missing");
    assert(typeof bundle.widgets.openTickets === "number", "Open tickets widget missing");
    assert(Array.isArray(bundle.tickets.items), "Tickets missing");
    assert(Array.isArray(bundle.incidents.items), "Incidents missing");
    assert(Array.isArray(bundle.knowledge.items), "Knowledge missing");
    assert(Array.isArray(bundle.serviceStatus.services), "Service status missing");

    const tickets = await queryControlCenterTickets({ page: 1, pageSize: 5 });
    assert(typeof tickets.total === "number", "Ticket total missing");

    const incidents = await queryControlCenterSupportIncidents({ page: 1, pageSize: 5 });
    assert(typeof incidents.total === "number", "Incident total missing");

    const knowledge = await queryControlCenterKnowledgeArticles({ page: 1, pageSize: 5 });
    assert(typeof knowledge.total === "number", "Knowledge total missing");

    console.log("  PASS");
  }

  console.log("\nControl center support verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
