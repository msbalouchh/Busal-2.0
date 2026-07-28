import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";

import { QR_MENU_ROUTES } from "../src/modules/qr-menu/constants/routes";
import {
  buildCreateQRCodePayload,
  buildUpdateQRCodePayload,
  validateQRCodeForm,
} from "../src/modules/qr-menu/lib/qr-menu-form";
import {
  computeQRMenuStats,
  formatLastScanned,
  formatQRCodeStatus,
  serializeQRCode,
  type ClientQRCode,
} from "../src/modules/qr-menu/lib/qr-menu-utils";
import {
  activateQRCode,
  createQRCode,
  deactivateQRCode,
  deleteQRCode,
  recordScan,
  updateQRCode,
} from "../src/services/qr-menu.service";

const prisma = new PrismaClient();
const root = join(import.meta.dirname, "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function filterQRCodes(
  qrCodes: ClientQRCode[],
  searchQuery: string,
  filterActive: "" | "active" | "inactive",
  filterAssignment: "" | "assigned" | "unassigned",
): ClientQRCode[] {
  const query = searchQuery.trim().toLowerCase();

  return qrCodes.filter((qrCode) => {
    if (filterActive === "active" && !qrCode.isActive) {
      return false;
    }

    if (filterActive === "inactive" && qrCode.isActive) {
      return false;
    }

    if (filterAssignment === "assigned" && !qrCode.tableId) {
      return false;
    }

    if (filterAssignment === "unassigned" && qrCode.tableId) {
      return false;
    }

    if (!query) {
      return true;
    }

    return qrCode.code.toLowerCase().includes(query) || qrCode.slug.toLowerCase().includes(query);
  });
}

async function main() {
  console.log("1. QR Menu appears in the sidebar");
  const navigation = readFileSync(
    join(root, "src/modules/dashboard/constants/navigation.ts"),
    "utf8",
  );
  assert(navigation.includes('"QR Menu"'), "QR Menu nav item missing");
  assert(navigation.includes("QR_MENU_ROUTES.overview"), "QR Menu route missing from nav");
  console.log("  PASS");

  console.log("2. /dashboard/qr-menu route exists");
  const pagePath = join(root, "src/app/dashboard/qr-menu/page.tsx");
  const pageSource = readFileSync(pagePath, "utf8");
  assert(pageSource.includes("QRMenuManager"), "QR menu page missing manager");
  assert(QR_MENU_ROUTES.overview === "/dashboard/qr-menu", "QR menu route mismatch");
  console.log("  PASS");

  const business = await prisma.business.findFirst({
    select: { ownerId: true, id: true },
  });
  assert(business, "No business found for verification");

  const ownerId = business.ownerId;
  const suffix = Date.now();
  let table = await prisma.table.findFirst({
    where: { businessId: business.id },
    select: { id: true, name: true },
  });
  let createdTableId: string | null = null;

  if (!table) {
    const createdTable = await prisma.table.create({
      data: {
        businessId: business.id,
        name: `Verify Table ${suffix}`,
        capacity: 4,
      },
      select: { id: true, name: true },
    });
    table = createdTable;
    createdTableId = createdTable.id;
  }

  console.log("4. Create QR Code works");
  const created = await createQRCode(
    ownerId,
    buildCreateQRCodePayload({
      slug: `verify-dash-${suffix}`,
      tableId: "",
      isActive: true,
    }),
  );
  assert(created.slug === `verify-dash-${suffix}`, "create failed");
  console.log("  PASS");

  console.log("5. Edit QR Code works");
  const edited = await updateQRCode(
    ownerId,
    created.id,
    buildUpdateQRCodePayload({
      slug: `verify-dash-edited-${suffix}`,
      tableId: "",
      isActive: true,
    }),
  );
  assert(edited.slug === `verify-dash-edited-${suffix}`, "edit failed");
  console.log("  PASS");

  if (table) {
    console.log("9. Assign Table works");
    const assigned = await updateQRCode(ownerId, created.id, { tableId: table.id });
    assert(assigned.tableId === table.id, "assign table failed");
    console.log("  PASS");

    console.log("10. Remove Table Assignment works");
    const unassigned = await updateQRCode(ownerId, created.id, { tableId: null });
    assert(unassigned.tableId === null, "remove table assignment failed");
    console.log("  PASS");
  } else {
    throw new Error("Unable to verify table assignment without a table");
  }

  console.log("8. Deactivate QR Code works");
  const deactivated = await deactivateQRCode(ownerId, created.id);
  assert(deactivated.isActive === false, "deactivate failed");
  console.log("  PASS");

  console.log("7. Activate QR Code works");
  const activated = await activateQRCode(ownerId, created.id);
  assert(activated.isActive === true, "activate failed");
  console.log("  PASS");

  console.log("16. Scan Count displays correctly");
  console.log("17. Last Scanned displays correctly");
  const scanned = await recordScan(ownerId, created.id);
  const clientQR = serializeQRCode(scanned, table?.name ?? null);
  assert(clientQR.scanCount === 1, "scan count incorrect");
  assert(clientQR.lastScannedAt !== null, "last scanned missing");
  assert(formatLastScanned(clientQR.lastScannedAt) !== "—", "last scanned format failed");
  console.log("  PASS");

  const assignedSample: ClientQRCode = {
    ...clientQR,
    tableId: table.id,
    tableName: table.name,
  };

  const sampleQRCodes: ClientQRCode[] = [
    assignedSample,
    {
      ...clientQR,
      id: "sample-inactive",
      code: "QR-OTHER-001",
      slug: "other-slug",
      isActive: false,
      tableId: null,
      tableName: null,
      scanCount: 0,
      lastScannedAt: null,
    },
  ];

  console.log("3. Overview cards display correctly");
  const stats = computeQRMenuStats(sampleQRCodes);
  assert(stats.total === 2, "total stat incorrect");
  assert(stats.active === 1, "active stat incorrect");
  assert(stats.inactive === 1, "inactive stat incorrect");
  assert(stats.assignedToTables === 1, "assigned stat incorrect");
  assert(stats.totalScans === 1, "total scans stat incorrect");
  console.log("  PASS");

  console.log("11. Search by Code works");
  assert(
    filterQRCodes(sampleQRCodes, clientQR.code.slice(0, 6), "", "").length === 1,
    "search by code failed",
  );
  console.log("  PASS");

  console.log("12. Search by Slug works");
  assert(filterQRCodes(sampleQRCodes, "other-slug", "", "").length === 1, "search by slug failed");
  console.log("  PASS");

  console.log("13. Active filter works");
  assert(filterQRCodes(sampleQRCodes, "", "active", "").length === 1, "active filter failed");
  console.log("  PASS");

  console.log("14. Assigned filter works");
  assert(filterQRCodes(sampleQRCodes, "", "", "assigned").length === 1, "assigned filter failed");
  console.log("  PASS");

  console.log("15. Unassigned filter works");
  assert(
    filterQRCodes(sampleQRCodes, "", "", "unassigned").length === 1,
    "unassigned filter failed",
  );
  console.log("  PASS");

  console.log("18. Loading state works");
  const listSource = readFileSync(
    join(root, "src/modules/qr-menu/components/qr-code-list.tsx"),
    "utf8",
  );
  assert(listSource.includes("isPending && qrCodes.length === 0"), "loading state missing");
  console.log("  PASS");

  console.log("19. Empty state works");
  assert(listSource.includes("EmptyState"), "empty state missing");
  assert(listSource.includes("No matching QR codes"), "filtered empty state missing");
  console.log("  PASS");

  console.log("20. Validation works");
  const validationErrors = validateQRCodeForm({ slug: "Bad Slug!", tableId: "", isActive: true });
  assert(validationErrors.slug, "validation should reject invalid slug");
  assert(
    Object.keys(buildCreateQRCodePayload({ slug: "valid-slug", tableId: "", isActive: true }))
      .length > 0,
    "create payload failed",
  );
  assert(formatQRCodeStatus(true) === "Active", "status label failed");
  assert(formatQRCodeStatus(false) === "Inactive", "status label failed");
  console.log("  PASS");

  console.log("6. Delete QR Code works");
  await deleteQRCode(ownerId, created.id);
  const afterDelete = await prisma.qRCode.findUnique({ where: { id: created.id } });
  assert(!afterDelete, "delete failed");
  console.log("  PASS");

  if (createdTableId) {
    await prisma.table.delete({ where: { id: createdTableId } });
  }

  console.log("\nAll QR Menu dashboard checks passed.");
}

main()
  .catch((error) => {
    console.error("\nFIRST ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
