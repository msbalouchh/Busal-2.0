import "server-only";

import { NextResponse } from "next/server";

import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";
import { RESERVATION_MODULE_PERMISSIONS } from "@/modules/reservations/constants/permissions";
import {
  resolveReservationScope,
  toReservationPlatformContext,
} from "@/modules/reservations/lib/reservation-scope";
import { reservationService } from "@/modules/reservations/services/reservation.service";
import { buildReservationPlatformSnapshot } from "@/modules/reservations/services/reservation-platform.service";
import {
  assignTableSchema,
  bulkUpdateReservationsSchema,
  cancelReservationSchema,
  createReservationSchema,
  reservationSearchSchema,
  updateReservationSchema,
  waitlistEntrySchema,
} from "@/modules/reservations/validation/reservation-schemas";

function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export async function handleListReservations(request: Request) {
  try {
    const platform = await protectedRoute({
      permission: RESERVATION_MODULE_PERMISSIONS.RESERVATION_READ,
    });
    const context = toReservationPlatformContext(resolveReservationScope(platform));
    const url = new URL(request.url);
    const parsed = reservationSearchSchema.parse(Object.fromEntries(url.searchParams.entries()));
    const [result, snapshot] = await Promise.all([
      reservationService.search(parsed, context),
      buildReservationPlatformSnapshot(context),
    ]);

    return jsonSuccess({ ...result, snapshot });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateReservation(request: Request) {
  try {
    const platform = await protectedRoute({
      permission: RESERVATION_MODULE_PERMISSIONS.RESERVATION_CREATE,
    });
    const scope = resolveReservationScope(platform);
    const context = toReservationPlatformContext(scope);
    const body = createReservationSchema.parse(await request.json());
    const record = await reservationService.create(context, {
      ...body,
      branchId: body.branchId ?? scope.branchId,
      guestLastName: body.guestLastName ?? "",
    });
    return jsonSuccess(record, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleGetReservation(_request: Request, reservationId: string) {
  try {
    const platform = await protectedRoute({
      permission: RESERVATION_MODULE_PERMISSIONS.RESERVATION_READ,
    });
    const context = toReservationPlatformContext(resolveReservationScope(platform));
    const record = await reservationService.getById(context, reservationId);

    if (!record) {
      return NextResponse.json({ success: false, error: "Reservation not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleUpdateReservation(request: Request, reservationId: string) {
  try {
    const platform = await protectedRoute({
      permission: RESERVATION_MODULE_PERMISSIONS.RESERVATION_UPDATE,
    });
    const context = toReservationPlatformContext(resolveReservationScope(platform));
    const body = updateReservationSchema.parse({ ...(await request.json()), reservationId });
    const record = await reservationService.update(context, body);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCancelReservation(request: Request, reservationId: string) {
  try {
    const platform = await protectedRoute({
      permission: RESERVATION_MODULE_PERMISSIONS.RESERVATION_CANCEL,
    });
    const context = toReservationPlatformContext(resolveReservationScope(platform));
    const body = cancelReservationSchema.parse({
      ...(await request.json()),
      reservationId,
      cancelledBy: resolveReservationScope(platform).userId,
    });
    const record = await reservationService.cancel(context, body);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleAssignTable(request: Request) {
  try {
    const platform = await protectedRoute({
      permission: RESERVATION_MODULE_PERMISSIONS.RESERVATION_ASSIGN_TABLE,
    });
    const context = toReservationPlatformContext(resolveReservationScope(platform));
    const body = assignTableSchema.parse(await request.json());
    const record = await reservationService.assignTable(context, {
      ...body,
      assignedBy: context.userId,
    });
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleWaitlistEntry(request: Request) {
  try {
    const platform = await protectedRoute({
      permission: RESERVATION_MODULE_PERMISSIONS.RESERVATION_MANAGE,
    });
    const scope = resolveReservationScope(platform);
    const context = toReservationPlatformContext(scope);
    const body = waitlistEntrySchema.parse(await request.json());
    const record = await reservationService.addToWaitlist(context, {
      ...body,
      branchId: body.branchId ?? scope.branchId,
    });
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleBulkUpdateReservations(request: Request) {
  try {
    const platform = await protectedRoute({
      permission: RESERVATION_MODULE_PERMISSIONS.RESERVATION_UPDATE,
    });
    const context = toReservationPlatformContext(resolveReservationScope(platform));
    const body = bulkUpdateReservationsSchema.parse(await request.json());
    const updated = await reservationService.bulkUpdate(context, body);
    return jsonSuccess({ updated });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}
