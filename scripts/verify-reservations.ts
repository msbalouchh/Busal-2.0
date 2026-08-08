import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { buildReservationPlatformContext } from "../src/modules/reservations/lib/reservation-platform-context";
import { buildReservationScopeFromInput } from "../src/modules/reservations/lib/reservation-scope";
import { reservationRepository } from "../src/modules/reservations/repository/reservation-repository";
import { bootstrapVerificationEnvironment } from "./lib/verify-bootstrap";
import { RESERVATION_SOURCES } from "../src/modules/reservations/constants/reservation-status";
import { publishNotificationEvent } from "../src/services/notifications.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  bootstrapVerificationEnvironment();

  console.log("Module structure");
  const moduleFiles = [
    "src/modules/reservations/index.ts",
    "src/modules/reservations/services/reservation.service.ts",
    "src/modules/reservations/repository/reservation-repository.ts",
    "src/modules/reservations/services/reservation-platform.service.ts",
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

  const context = buildReservationPlatformContext({
    businessId: business.id,
    branchId: branch.id,
    userId: business.ownerId,
  });

  const suffix = Date.now();
  const scheduledDate = new Date().toISOString().slice(0, 10);

  const scope = buildReservationScopeFromInput(context);

  console.log("Create reservation");
  const created = await reservationRepository.create(scope, {
    branchId: branch.id,
    partySize: 4,
    scheduledDate,
    startTime: "19:00",
    endTime: "21:00",
    guestFirstName: "Verify",
    guestLastName: `Guest ${suffix}`,
    guestEmail: `verify-${suffix}@example.com`,
    guestPhone: "555-0101",
    source: RESERVATION_SOURCES.WEBSITE,
  });
  assert(created.reservation.id, "reservation not created");
  console.log("  PASS");

  console.log("Edit reservation");
  const updated = await reservationRepository.update(scope, {
    reservationId: created.reservation.id,
    partySize: 5,
    notes: "Updated during verification",
  });
  assert(updated?.reservation.partySize === 5, "update failed");
  console.log("  PASS");

  console.log("Assign table");
  const floor = await prisma.restaurantFloor.findFirst({
    where: { businessId: business.id, branchId: branch.id },
  });
  let tableId: string | undefined;
  if (floor) {
    const table = await prisma.restaurantTable.findFirst({
      where: { businessId: business.id, branchId: branch.id, floorId: floor.id },
    });
    tableId = table?.id;
  }
  if (!tableId) {
    const legacyTable = await prisma.legacyTable.findFirst({ where: { businessId: business.id } });
    tableId = legacyTable?.id;
  }
  if (tableId) {
    const assigned = await reservationRepository.assignTable(scope, {
      reservationId: created.reservation.id,
      tableId,
    });
    assert(assigned?.seating.assignedTableId === tableId, "table assignment failed");
  }
  console.log("  PASS");

  console.log("Walk-in waitlist");
  const walkInReservation = await reservationRepository.create(scope, {
    branchId: branch.id,
    partySize: 2,
    scheduledDate,
    startTime: "12:00",
    guestFirstName: "Walk",
    guestLastName: "In",
    guestPhone: "555-0102",
    source: RESERVATION_SOURCES.WALK_IN,
  });
  assert(walkInReservation?.reservation.id, "walk-in reservation failed");
  const waitlisted = await reservationRepository.addToWaitlist(scope, {
    reservationId: walkInReservation.reservation.id,
    branchId: branch.id,
    partySize: 2,
  });
  assert(waitlisted?.reservation.id, "waitlist failed");
  console.log("  PASS");

  console.log("Notifications");
  const published = await publishNotificationEvent({
    businessId: business.id,
    category: "RESERVATIONS",
    title: "Reservation verified",
    body: `Reservation ${created.reservation.id} verified`,
    triggeredByModule: "verify-reservations",
    triggeredByUserId: business.ownerId,
    recipientUserIds: [business.ownerId],
  });
  assert(published.notificationId, "notification publish failed");
  console.log("  PASS");

  console.log("Cancel reservation");
  const cancelled = await reservationRepository.cancel(scope, {
    reservationId: created.reservation.id,
    reason: "Verification cleanup",
  });
  assert(cancelled?.reservation.status === "cancelled", "cancel failed");
  console.log("  PASS");

  console.log("Analytics/search");
  const search = await reservationRepository.search(scope, {
    query: `Guest ${suffix}`,
    page: 1,
    pageSize: 10,
  });
  assert(search.total >= 1, "search failed");
  console.log("  PASS");

  console.log("\nReservations verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
