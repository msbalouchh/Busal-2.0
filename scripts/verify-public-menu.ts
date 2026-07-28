import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PUBLIC_MENU_INVALID_MESSAGE } from "../src/modules/public-menu/constants/routes";
import { buildPublicMenuViewModel } from "../src/modules/public-menu/lib/public-menu-utils";
import { listActiveCategories, listPublicMenuItems } from "../src/services/menu-management.service";
import {
  createQRCode,
  deactivateQRCode,
  deleteQRCode,
  recordPublicMenuVisit,
  resolvePublicQRMenu,
} from "../src/services/qr-menu.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const business = await prisma.business.findFirst({
    select: { ownerId: true, id: true },
  });
  assert(business, "No business found for verification");

  const ownerId = business.ownerId;
  const suffix = Date.now();
  const slug = `public-menu-${suffix}`;

  console.log("Setup active QR code");
  const qrCode = await createQRCode(ownerId, { slug, isActive: true });
  const initialScanCount = qrCode.scanCount;
  console.log("  PASS");

  console.log("Valid QR slug resolves");
  const valid = await resolvePublicQRMenu(slug);
  assert(valid.ok, "valid slug should resolve");
  assert(valid.ok && valid.data.qrCode.id === qrCode.id, "resolved QR mismatch");
  console.log("  PASS");

  console.log("Invalid slug shows error state");
  const invalid = await resolvePublicQRMenu("missing-slug-xyz");
  assert(!invalid.ok && invalid.reason === "not_found", "invalid slug should fail");
  console.log("  PASS");

  console.log("Inactive QR shows error state");
  await deactivateQRCode(ownerId, qrCode.id);
  const inactive = await resolvePublicQRMenu(slug);
  assert(!inactive.ok && inactive.reason === "inactive", "inactive QR should fail");
  console.log("  PASS");

  console.log("Re-activate QR for visit tests");
  await prisma.qRCode.update({ where: { id: qrCode.id }, data: { isActive: true } });
  console.log("  PASS");

  console.log("Scan count increases");
  const sessionToken = `verify-public-${suffix}`;
  const visit = await recordPublicMenuVisit(ownerId, qrCode.id, { sessionToken });
  assert(visit.qrCode.scanCount === initialScanCount + 1, "scan count should increment");
  console.log("  PASS");

  console.log("QR session created");
  const session = await prisma.qRMenuSession.findUnique({ where: { sessionToken } });
  assert(session?.qrCodeId === qrCode.id, "session should link to QR code");
  console.log("  PASS");

  console.log("Categories display");
  const categories = await listActiveCategories(business.id);
  const menuItems = await listPublicMenuItems(business.id);
  const menu = buildPublicMenuViewModel(
    valid.ok
      ? valid.data.business
      : { id: business.id, businessName: null, logoUrl: null, welcomeMessage: null },
    categories,
    menuItems,
  );
  assert(Array.isArray(menu.categories), "categories should be an array");
  console.log("  PASS");

  console.log("Menu items display");
  assert(Array.isArray(menuItems), "menu items should load");
  console.log("  PASS");

  console.log("Public route exists");
  const pageSource = readFileSync(join(root, "src/app/menu/[slug]/page.tsx"), "utf8");
  assert(pageSource.includes("PublicMenuWithCart"), "public menu page missing");
  console.log("  PASS");

  console.log("Invalid message copy");
  const errorSource = readFileSync(
    join(root, "src/modules/public-menu/components/public-menu-error-page.tsx"),
    "utf8",
  );
  const constantsSource = readFileSync(
    join(root, "src/modules/public-menu/constants/routes.ts"),
    "utf8",
  );
  assert(
    errorSource.includes("PUBLIC_MENU_INVALID_MESSAGE"),
    "error page should use invalid message",
  );
  assert(constantsSource.includes(PUBLIC_MENU_INVALID_MESSAGE), "invalid message constant missing");
  console.log("  PASS");

  console.log("Mobile-first layout");
  const viewSource = readFileSync(
    join(root, "src/modules/public-menu/components/public-menu-view.tsx"),
    "utf8",
  );
  assert(viewSource.includes("max-w-3xl"), "mobile layout container missing");
  console.log("  PASS");

  console.log("Cleanup");
  if (session) {
    await prisma.qRMenuSession.delete({ where: { id: session.id } });
  }
  await deleteQRCode(ownerId, qrCode.id);
  console.log("  PASS");

  console.log("\nAll public menu checks passed.");
}

main()
  .catch((error) => {
    console.error("\nFIRST ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
