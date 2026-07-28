import { PrismaClient } from "@prisma/client";

import {
  activateQRCode,
  createQRCode,
  createQRMenuSession,
  deactivateQRCode,
  deleteQRCode,
  endQRMenuSession,
  getQRCodeById,
  getQRCodeBySlug,
  listQRCodes,
  recordScan,
  updateQRCode,
} from "../src/services/qr-menu.service";

const prisma = new PrismaClient();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const business = await prisma.business.findFirst({
    select: { ownerId: true, id: true },
  });

  if (!business) {
    throw new Error("No business found");
  }

  const ownerId = business.ownerId;
  const suffix = Date.now();

  console.log("createQRCode()");
  const created = await createQRCode(ownerId, {
    slug: `verify-qr-${suffix}`,
    code: `QR-VERIFY-${suffix}`,
  });
  assert(created.isActive === true, "default isActive");
  assert(created.scanCount === 0, "default scanCount");
  console.log("  PASS");

  console.log("getQRCodeById()");
  const byId = await getQRCodeById(ownerId, created.id);
  assert(byId.id === created.id, "getQRCodeById failed");
  console.log("  PASS");

  console.log("getQRCodeBySlug()");
  const bySlug = await getQRCodeBySlug(ownerId, created.slug);
  assert(bySlug.id === created.id, "getQRCodeBySlug failed");
  console.log("  PASS");

  console.log("listQRCodes()");
  const listed = await listQRCodes(ownerId, { isActive: true });
  assert(
    listed.some((item) => item.id === created.id),
    "listQRCodes failed",
  );
  console.log("  PASS");

  console.log("updateQRCode()");
  const updated = await updateQRCode(ownerId, created.id, {
    slug: `verify-qr-updated-${suffix}`,
  });
  assert(updated.slug === `verify-qr-updated-${suffix}`, "updateQRCode failed");
  console.log("  PASS");

  console.log("deactivateQRCode()");
  const deactivated = await deactivateQRCode(ownerId, created.id);
  assert(deactivated.isActive === false, "deactivateQRCode failed");
  console.log("  PASS");

  console.log("activateQRCode()");
  const activated = await activateQRCode(ownerId, created.id);
  assert(activated.isActive === true, "activateQRCode failed");
  console.log("  PASS");

  console.log("recordScan()");
  const scanned = await recordScan(ownerId, created.id);
  assert(scanned.scanCount === 1, "scanCount increment failed");
  assert(scanned.lastScannedAt instanceof Date, "lastScannedAt update failed");
  console.log("  PASS");

  console.log("createQRMenuSession()");
  const session = await createQRMenuSession(ownerId, {
    qrCodeId: created.id,
    sessionToken: `session-${suffix}`,
    deviceInfo: "test-device",
    ipAddress: "127.0.0.1",
  });
  assert(session.endedAt === null, "session should be active");
  console.log("  PASS");

  console.log("deleteQRCode() active session guard");
  let deleteBlocked = false;
  try {
    await deleteQRCode(ownerId, created.id);
  } catch (error) {
    deleteBlocked = error instanceof Error && error.message.includes("active sessions");
  }
  assert(deleteBlocked, "delete guard failed");
  console.log("  PASS");

  console.log("endQRMenuSession()");
  const ended = await endQRMenuSession(ownerId, session.id);
  assert(ended.endedAt instanceof Date, "endQRMenuSession failed");
  console.log("  PASS");

  console.log("deleteQRCode()");
  await deleteQRCode(ownerId, created.id);
  const afterDelete = await prisma.qRCode.findUnique({ where: { id: created.id } });
  assert(!afterDelete, "deleteQRCode failed");
  console.log("  PASS");

  console.log("\nAll QR menu service methods verified.");
}

main()
  .catch((error) => {
    console.error("\nFIRST ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
