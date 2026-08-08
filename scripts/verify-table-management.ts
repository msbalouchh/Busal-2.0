import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { getVerifyPrisma } from "./lib/verify-prisma";
import { connectWithRetry, handleVerificationError } from "./lib/verify-db";
import { bootstrapVerificationEnvironment } from "./lib/verify-bootstrap";
import { TABLE_STATUSES } from "../src/modules/table-management/constants/table-status";
import { buildTablePlatformContext } from "../src/modules/table-management/lib/table-platform-context";
import { tableManagementService } from "../src/modules/table-management/services/table-management.service";

const prisma = getVerifyPrisma();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  bootstrapVerificationEnvironment();
  await connectWithRetry(prisma);

  console.log("Module structure");
  const moduleFiles = [
    "src/modules/table-management/index.ts",
    "src/modules/table-management/services/table-management.service.ts",
    "src/modules/table-management/repository/table-management-repository.ts",
    "src/modules/table-management/services/table-platform.service.ts",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  const business = await prisma.business.findFirst({
    include: { owner: true, branches: { where: { isMain: true }, take: 1 } },
  });
  assert(business?.owner, "No business owner found");
  const branch = business.branches[0] ?? (await prisma.branch.findFirst({ where: { businessId: business.id } }));
  assert(branch, "No branch found");

  const context = buildTablePlatformContext({
    businessId: business.id,
    branchId: branch.id,
    userId: business.ownerId,
  });

  const suffix = Date.now();

  console.log("Create floor");
  const floor = await tableManagementService.createFloor(context, {
    name: `Verify Floor ${suffix}`,
    description: "Verification floor",
  });
  assert(floor.floor.id, "floor not created");
  console.log("  PASS");

  console.log("Create tables");
  const tableA = await tableManagementService.createTable(context, {
    floorId: floor.floor.id,
    label: `Table A ${suffix}`,
    seatCapacity: 4,
  });
  const tableB = await tableManagementService.createTable(context, {
    floorId: floor.floor.id,
    label: `Table B ${suffix}`,
    seatCapacity: 4,
  });
  assert(tableA.table.id && tableB.table.id, "tables not created");
  console.log("  PASS");

  console.log("Merge tables");
  const merged = await tableManagementService.mergeTables(context, {
    floorId: floor.floor.id,
    sourceTableIds: [tableA.table.id, tableB.table.id],
    mergedLabel: `Merged ${suffix}`,
    actorId: business.ownerId,
  });
  assert(merged?.table.id, "merge failed");
  console.log("  PASS");

  console.log("Split table");
  const splitTables = await tableManagementService.splitTable(context, {
    floorId: floor.floor.id,
    sourceTableId: merged.table.id,
    newLabels: [`Split A ${suffix}`, `Split B ${suffix}`],
    actorId: business.ownerId,
  });
  assert(splitTables.length >= 2, "split failed");
  console.log("  PASS");

  console.log("Assign table");
  const assignTarget = splitTables[0];
  assert(assignTarget, "assign target missing");
  const assigned = await tableManagementService.updateTable(context, {
    tableId: assignTarget.table.id,
    status: TABLE_STATUSES.OCCUPIED,
  });
  assert(assigned?.table.status === TABLE_STATUSES.OCCUPIED, "assign failed");
  console.log("  PASS");

  console.log("Release table");
  const released = await tableManagementService.updateTable(context, {
    tableId: assignTarget.table.id,
    status: TABLE_STATUSES.AVAILABLE,
  });
  assert(released?.table.status === TABLE_STATUSES.AVAILABLE, "release failed");
  console.log("  PASS");

  console.log("\nTable management verification passed.");
}

main()
  .catch(handleVerificationError)
  .finally(async () => {
    await prisma.$disconnect();
  });
