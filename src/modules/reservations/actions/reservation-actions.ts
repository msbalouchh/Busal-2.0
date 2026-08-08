"use server";

import type { ReservationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { RESERVATION_MODULE_PERMISSIONS } from "@/modules/reservations/constants/permissions";
import { RESERVATION_ROUTES } from "@/modules/reservations/constants/routes";
import {
  resolveReservationScope,
  toReservationPlatformContext,
} from "@/modules/reservations/lib/reservation-scope";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { reservationService } from "@/modules/reservations/services/reservation.service";
import {
  assignTableSchema,
  cancelReservationSchema,
  clientCreateReservationSchema,
  clientUpdateReservationSchema,
  createReservationSchema,
  prismaStatusUpdateSchema,
  updateReservationSchema,
  waitlistEntrySchema,
} from "@/modules/reservations/validation/reservation-schemas";
import { RESERVATION_SOURCES } from "@/modules/reservations/constants/reservation-status";

function revalidateReservationPages() {
  revalidatePath(RESERVATION_ROUTES.overview);
  revalidatePath("/dashboard/restaurant/reservations");
  revalidatePath("/app/restaurant/reservations");
}

function mapFormSource(source: string) {
  switch (source) {
    case "ADMIN":
      return RESERVATION_SOURCES.STAFF;
    case "OTHER":
      return RESERVATION_SOURCES.WHATSAPP;
    case "WEBSITE":
      return RESERVATION_SOURCES.WEBSITE;
    case "WALK_IN":
      return RESERVATION_SOURCES.WALK_IN;
    case "QR":
      return RESERVATION_SOURCES.QR;
    case "GOOGLE":
      return RESERVATION_SOURCES.GOOGLE;
    case "FACEBOOK":
      return RESERVATION_SOURCES.FACEBOOK;
    case "INSTAGRAM":
      return RESERVATION_SOURCES.INSTAGRAM;
    case "PHONE":
    default:
      return RESERVATION_SOURCES.PHONE;
  }
}

export async function createReservationAction(input: unknown) {
  return protectedAction(RESERVATION_MODULE_PERMISSIONS.RESERVATION_CREATE, async ({ platform }) => {
    const body = clientCreateReservationSchema.parse(input);
    const scope = resolveReservationScope(platform);
    const context = toReservationPlatformContext(scope);

    const record = await reservationService.create(context, {
      branchId: scope.branchId,
      partySize: body.partySize,
      scheduledDate: body.reservationDate,
      startTime: body.startTime,
      endTime: body.endTime,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail,
      notes: body.notes,
      source: body.source ? mapFormSource(body.source) : RESERVATION_SOURCES.PHONE,
    });

    revalidateReservationPages();
    return { success: true as const, record };
  });
}

export async function updateReservationAction(reservationId: string, input: unknown) {
  return protectedAction(RESERVATION_MODULE_PERMISSIONS.RESERVATION_UPDATE, async ({ platform }) => {
    const body = clientUpdateReservationSchema.parse(input);
    const context = toReservationPlatformContext(resolveReservationScope(platform));

    const record = await reservationService.update(context, {
      reservationId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail,
      scheduledDate: body.reservationDate,
      startTime: body.startTime,
      endTime: body.endTime,
      partySize: body.partySize,
      notes: body.notes,
      source: body.source ? mapFormSource(body.source) : undefined,
    });

    revalidateReservationPages();
    return { success: true as const, record };
  });
}

export async function cancelReservationAction(reservationId: string, reason = "Guest request") {
  return protectedAction(RESERVATION_MODULE_PERMISSIONS.RESERVATION_CANCEL, async ({ platform }) => {
    const context = toReservationPlatformContext(resolveReservationScope(platform));
    const record = await reservationService.cancel(context, {
      reservationId,
      reason,
      cancelledBy: context.userId,
    });
    revalidateReservationPages();
    return { success: true as const, record };
  });
}

export async function updateReservationStatusAction(
  reservationId: string,
  status: ReservationStatus,
) {
  return protectedAction(RESERVATION_MODULE_PERMISSIONS.RESERVATION_UPDATE, async ({ platform }) => {
    prismaStatusUpdateSchema.parse({ reservationId, status });
    const context = toReservationPlatformContext(resolveReservationScope(platform));
    const record = await reservationService.updatePrismaStatus(context, reservationId, status);
    revalidateReservationPages();
    return { success: true as const, record };
  });
}

export async function confirmReservationAction(reservationId: string) {
  return protectedAction(RESERVATION_MODULE_PERMISSIONS.RESERVATION_UPDATE, async ({ platform }) => {
    const context = toReservationPlatformContext(resolveReservationScope(platform));
    const record = await reservationService.confirm(context, reservationId);
    revalidateReservationPages();
    return { success: true as const, record };
  });
}

export async function checkInReservationAction(reservationId: string) {
  return protectedAction(RESERVATION_MODULE_PERMISSIONS.RESERVATION_UPDATE, async ({ platform }) => {
    const context = toReservationPlatformContext(resolveReservationScope(platform));
    const record = await reservationService.checkIn(context, reservationId);
    revalidateReservationPages();
    return { success: true as const, record };
  });
}

export async function assignTableAction(input: unknown) {
  return protectedAction(RESERVATION_MODULE_PERMISSIONS.RESERVATION_ASSIGN_TABLE, async ({ platform }) => {
    const body = assignTableSchema.parse(input);
    const context = toReservationPlatformContext(resolveReservationScope(platform));
    const record = await reservationService.assignTable(context, {
      ...body,
      assignedBy: context.userId,
    });
    revalidateReservationPages();
    return { success: true as const, record };
  });
}

export async function addToWaitlistAction(input: unknown) {
  return protectedAction(RESERVATION_MODULE_PERMISSIONS.RESERVATION_MANAGE, async ({ platform }) => {
    const body = waitlistEntrySchema.parse(input);
    const scope = resolveReservationScope(platform);
    const context = toReservationPlatformContext(scope);
    const record = await reservationService.addToWaitlist(context, {
      ...body,
      branchId: body.branchId ?? scope.branchId,
    });
    revalidateReservationPages();
    return { success: true as const, record };
  });
}

export async function archiveReservationAction(reservationId: string) {
  return protectedAction(RESERVATION_MODULE_PERMISSIONS.RESERVATION_DELETE, async ({ platform }) => {
    const context = toReservationPlatformContext(resolveReservationScope(platform));
    const record = await reservationService.archive(context, reservationId);
    revalidateReservationPages();
    return { success: true as const, record };
  });
}

export async function restoreReservationAction(reservationId: string) {
  return protectedAction(RESERVATION_MODULE_PERMISSIONS.RESERVATION_UPDATE, async ({ platform }) => {
    const context = toReservationPlatformContext(resolveReservationScope(platform));
    const record = await reservationService.restore(context, reservationId);
    revalidateReservationPages();
    return { success: true as const, record };
  });
}

export async function createReservationModuleAction(input: unknown) {
  return protectedAction(RESERVATION_MODULE_PERMISSIONS.RESERVATION_CREATE, async ({ platform }) => {
    const body = createReservationSchema.parse(input);
    const scope = resolveReservationScope(platform);
    const context = toReservationPlatformContext(scope);
    const record = await reservationService.create(context, {
      ...body,
      branchId: body.branchId ?? scope.branchId,
      guestFirstName: body.guestFirstName,
      guestLastName: body.guestLastName ?? "",
    });
    revalidateReservationPages();
    return { success: true as const, record };
  });
}

export async function updateReservationModuleAction(input: unknown) {
  return protectedAction(RESERVATION_MODULE_PERMISSIONS.RESERVATION_UPDATE, async ({ platform }) => {
    const body = updateReservationSchema.parse(input);
    const context = toReservationPlatformContext(resolveReservationScope(platform));
    const record = await reservationService.update(context, body);
    revalidateReservationPages();
    return { success: true as const, record };
  });
}

export async function cancelReservationModuleAction(input: unknown) {
  return protectedAction(RESERVATION_MODULE_PERMISSIONS.RESERVATION_CANCEL, async ({ platform }) => {
    const body = cancelReservationSchema.parse(input);
    const context = toReservationPlatformContext(resolveReservationScope(platform));
    const record = await reservationService.cancel(context, body);
    revalidateReservationPages();
    return { success: true as const, record };
  });
}
