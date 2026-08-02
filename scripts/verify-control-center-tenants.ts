import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";
import { CONTROL_CENTER_TENANT_ROUTES } from "../src/modules/control-center/tenants/constants/control-center-tenants";
import {
  buildControlCenterOperatorContext,
  isControlCenterOperatorEmail,
} from "../src/modules/control-center/lib/resolve-control-center-authorization";
import {
  getControlCenterTenantDetailBundle,
  getControlCenterTenantManagementBundle,
  queryControlCenterTenantDirectory,
} from "../src/services/control-center-tenants.service";
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
  console.log("Control center tenant management module structure");
  const moduleFiles = [
    "src/modules/control-center/tenants/index.ts",
    "src/modules/control-center/tenants/types/control-center-tenants-types.ts",
    "src/modules/control-center/tenants/constants/control-center-tenants.ts",
    "src/modules/control-center/tenants/lib/build-operator-tenant-context.ts",
    "src/modules/control-center/tenants/lib/get-control-center-tenants-context.ts",
    "src/modules/control-center/tenants/actions/control-center-tenant-actions.ts",
    "src/modules/control-center/tenants/components/control-center-tenant-directory.tsx",
    "src/modules/control-center/tenants/components/control-center-tenant-detail.tsx",
    "src/modules/control-center/tenants/components/tenant-status-badge.tsx",
    "src/modules/control-center/tenants/components/tenant-activity-timeline.tsx",
    "src/modules/control-center/tenants/components/tenant-confirm-dialog.tsx",
    "src/services/control-center-tenants.service.ts",
    "src/app/control-center/(shell)/tenants/page.tsx",
    "src/app/control-center/(shell)/tenants/[businessId]/page.tsx",
  ];

  for (const file of moduleFiles) {
    read(file);
  }
  console.log("  PASS");

  console.log("Permission-aware guards");
  const contextLoader = read(
    "src/modules/control-center/tenants/lib/get-control-center-tenants-context.ts",
  );
  assert(
    contextLoader.includes("PERMISSION_CODES.CONTROL_CENTER_TENANTS"),
    "CONTROL_CENTER_TENANTS guard missing",
  );
  assert(
    contextLoader.includes("protectedControlCenterPage"),
    "protectedControlCenterPage missing",
  );
  const actions = read(
    "src/modules/control-center/tenants/actions/control-center-tenant-actions.ts",
  );
  assert(actions.includes("protectedControlCenterAction"), "protectedControlCenterAction missing");
  assert(
    actions.includes("PERMISSION_CODES.CONTROL_CENTER_TENANTS_SUSPEND"),
    "suspend action guard missing",
  );
  assert(
    actions.includes("PERMISSION_CODES.CONTROL_CENTER_TENANTS_DELETE"),
    "delete action guard missing",
  );
  console.log("  PASS");

  console.log("Tenant directory UI");
  const directory = read(
    "src/modules/control-center/tenants/components/control-center-tenant-directory.tsx",
  );
  assert(directory.includes("queryControlCenterTenantsAction"), "directory query action missing");
  assert(directory.includes("TenantStatusBadge"), "status badges missing");
  assert(directory.includes("Quick view"), "detail drawer missing");
  console.log("  PASS");

  console.log("Tenant detail UI");
  const detail = read(
    "src/modules/control-center/tenants/components/control-center-tenant-detail.tsx",
  );
  assert(detail.includes("TenantConfirmDialog"), "confirmation dialogs missing");
  assert(detail.includes("TenantPlatformLists"), "tenant platform lists reuse missing");
  assert(detail.includes("Branch overview"), "branch overview missing");
  assert(detail.includes("Maintenance"), "maintenance controls missing");
  console.log("  PASS");

  console.log("Control center tenant routes");
  assert(
    CONTROL_CENTER_TENANT_ROUTES.directory.startsWith("/control-center/tenants"),
    "Invalid directory route",
  );
  console.log("  PASS");

  console.log("Live control center tenant workflow");
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
    const bundle = await getControlCenterTenantManagementBundle(operator);
    assert(bundle.permissions.canView, "View permission missing");
    assert(Array.isArray(bundle.directory.items), "Directory items missing");

    const directoryResult = await queryControlCenterTenantDirectory({ page: 1, pageSize: 5 });
    assert(typeof directoryResult.total === "number", "Directory total missing");

    const tenantRecord = await prisma.tenantRecord.findFirst({
      orderBy: { createdAt: "asc" },
      select: { businessId: true },
    });
    assert(tenantRecord, "Tenant record missing");

    const detailBundle = await getControlCenterTenantDetailBundle(
      operator,
      tenantRecord.businessId,
    );
    assert(detailBundle.profile.businessId === tenantRecord.businessId, "Detail profile missing");
    assert(Array.isArray(detailBundle.profile.branches), "Branch overview missing");
    assert(Array.isArray(detailBundle.profile.auditLogs), "Audit logs missing");
    console.log("  PASS");
  }

  console.log("\nControl center tenant management verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
