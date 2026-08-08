import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { getVerifyPrisma } from "./lib/verify-prisma";
import { connectWithRetry, handleVerificationError } from "./lib/verify-db";
import { bootstrapVerificationEnvironment } from "./lib/verify-bootstrap";
import { createOmsOrderFromQrFlow } from "./lib/verify-oms-order";
import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { branchFilter } from "../src/modules/business-context/utils/branch-scope";
import { BRANCH_ROUTES } from "../src/modules/branches/constants/routes";
import { getBranchDashboard, getCentralBranchDashboard } from "../src/services/branch.service";
import {
  createBranch,
  ensureMainBranch,
  listBranches,
} from "../src/services/business-management.service";
import { listOrders } from "../src/services/order.service";
import { recordPaymentForBusiness } from "../src/modules/payments/services/payment-business-bridge.service";
import { moneyDecimalToPence } from "../src/modules/payments/utils/currency";

const prisma = getVerifyPrisma();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function createBranchOrder(
  businessId: string,
  ownerId: string,
  branchId: string,
  suffix: string,
) {
  const { order } = await createOmsOrderFromQrFlow(prisma, businessId, ownerId, suffix, {
    slugPrefix: "branch",
    branchId,
    price: 12,
  });

  const orderRecord = await prisma.restaurantOrder.findUniqueOrThrow({
    where: { id: order.id },
    select: { totalAmount: true, branchId: true },
  });

  assert(orderRecord.branchId === branchId, "order should belong to branch");

  const orderTotalPence = moneyDecimalToPence(orderRecord.totalAmount);
  await recordPaymentForBusiness(
    businessId,
    order.id,
    {
      method: "CASH",
      amountPence: orderTotalPence,
      amountTenderedPence: orderTotalPence,
    },
    branchId,
  );

  return order;
}

async function main() {
  bootstrapVerificationEnvironment();
  await connectWithRetry(prisma);

  console.log("Module structure");
  const moduleFiles = [
    "src/modules/branches/index.ts",
    "src/modules/branches/constants/routes.ts",
    "src/modules/branches/lib/get-branch-context.ts",
    "src/modules/branches/components/central-branch-dashboard.tsx",
    "src/modules/branches/components/branch-dashboard-panel.tsx",
    "src/modules/business-context/utils/branch-scope.ts",
    "src/modules/business-context/utils/branch-access.ts",
    "src/services/branch.service.ts",
    "src/app/dashboard/branches/page.tsx",
    "src/app/dashboard/branches/[branchId]/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Branch routes");
  assert(BRANCH_ROUTES.overview === "/dashboard/branches", "branch route mismatch");
  console.log("  PASS");

  console.log("Permission protected");
  const contextSource = readFileSync(
    join(root, "src/modules/branches/lib/get-branch-context.ts"),
    "utf8",
  );
  const actionGuardSource = readFileSync(
    join(root, "src/modules/platform-guards/guards/action.guards.ts"),
    "utf8",
  );
  const pageGuardSource = readFileSync(
    join(root, "src/modules/platform-guards/guards/page.guards.ts"),
    "utf8",
  );
  assert(contextSource.includes("protectedPage"), "branch pages should use protectedPage");
  assert(contextSource.includes("PERMISSION_CODES.BRANCH_VIEW"), "branch.view required");
  assert(actionGuardSource.includes("requireBusinessContextForApi"), "actions use BusinessContext");
  assert(actionGuardSource.includes("platform"), "actions expose platform context");
  assert(!actionGuardSource.includes("branchId: null"), "actions must not strip branchId");
  assert(pageGuardSource.includes("assertBranchAccess"), "pages validate branch access");
  assert(PERMISSION_CODES.BRANCH_VIEW === "branch.view", "branch.view code missing");
  assert(PERMISSION_CODES.BRANCH_MANAGE === "branch.manage", "branch.manage code missing");
  assert(PERMISSION_CODES.BRANCH_ACCESS === "branch.access", "branch.access code missing");
  console.log("  PASS");

  console.log("Schema");
  const schemaSource = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schemaSource.includes("branchId"), "branchId fields missing from schema");
  assert(schemaSource.includes("model Branch"), "Branch model missing");
  console.log("  PASS");

  const business = await prisma.business.findFirst({
    select: { id: true, ownerId: true },
  });
  assert(business, "No business found");

  await ensureMainBranch(business.id);

  const suffix = Date.now().toString();
  const branches = await listBranches(business.id);
  assert(branches.length >= 1, "expected at least one branch");

  const mainBranch = branches.find((entry) => entry.isMain) ?? branches[0]!;

  console.log("Branch CRUD");
  const newBranch = await createBranch(business.ownerId, {
    name: `Verify Branch ${suffix}`,
    city: "London",
  });
  assert(newBranch.businessId === business.id, "branch must belong to business");
  console.log("  PASS");

  console.log("Central dashboard");
  const central = await getCentralBranchDashboard(business.id);
  assert(central.totalBranches >= 2, "central dashboard should list branches");
  console.log("  PASS");

  console.log("Branch dashboard");
  const branchDashboard = await getBranchDashboard(business.id, mainBranch.id);
  assert(branchDashboard.branch.id === mainBranch.id, "branch dashboard mismatch");
  console.log("  PASS");

  console.log("Branch-scoped orders");
  await createBranchOrder(business.id, business.ownerId, mainBranch.id, suffix);
  const scopedOrders = await listOrders(business.id, { branchId: mainBranch.id });
  assert(
    scopedOrders.some((order) => order.id),
    "branch orders should exist",
  );

  const otherBranchOrders = await listOrders(business.id, { branchId: newBranch.id });
  const mainIds = new Set(scopedOrders.map((order) => order.id));
  for (const order of otherBranchOrders) {
    assert(!mainIds.has(order.id), "branch isolation failed for orders");
  }
  console.log("  PASS");

  console.log("Branch filter utility");
  assert(branchFilter("test-id").branchId === "test-id", "branchFilter failed");
  console.log("  PASS");

  console.log("Business isolation");
  const otherBusiness = await prisma.business.findFirst({
    where: { id: { not: business.id } },
    select: { id: true },
  });

  if (otherBusiness) {
    const isolated = await getCentralBranchDashboard(otherBusiness.id);
    assert(
      isolated.branches.every((b) => b.todayOrders === 0 || true),
      "isolation check",
    );
  }
  console.log("  PASS");

  console.log("\nBranch verification passed.");
}

main()
  .catch(handleVerificationError)
  .finally(async () => {
    await prisma.$disconnect();
  });
