"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { RESERVATION_MANAGEMENT_ROUTES } from "@/modules/reservation-management/constants/routes";
import { requireReservationActionContext } from "@/modules/reservation-management/lib/get-reservation-management-context";
import { validateReservationInput } from "@/modules/reservation-management/lib/reservation-validation";
import type {
  AssignReservationStaffInput,
  AssignReservationTableInput,
  ReservationManagementInput,
  TableAvailabilityQuery,
} from "@/modules/reservation-management/types/reservation-management-types";
import {
  assignStaffToReservation,
  assignTableToReservation,
  cancelManagedReservation,
  checkTableAvailability,
  completeManagedReservation,
  confirmManagedReservation,
  createManagedReservation,
  deleteManagedReservation,
  markNoShowManagedReservation,
  seatManagedReservation,
  updateManagedReservation,
} from "@/services/restaurant-reservation.service";

function revalidateReservationPages(branchId: string, reservationId?: string) {
  revalidatePath(RESERVATION_MANAGEMENT_ROUTES.listForBranch(branchId));

  if (reservationId) {
    revalidatePath(RESERVATION_MANAGEMENT_ROUTES.details(reservationId, branchId));
    revalidatePath(RESERVATION_MANAGEMENT_ROUTES.edit(reservationId, branchId));
  }
}

export async function createReservationManagementAction(
  branchId: string,
  input: ReservationManagementInput,
) {
  const context = await requireReservationActionContext(
    branchId,
    PERMISSION_CODES.RESERVATION_CREATE,
  );
  validateReservationInput(input);
  const reservation = await createManagedReservation(context.user.id, { ...input, branchId });
  revalidateReservationPages(branchId, reservation.id);
  return { success: true as const, reservationId: reservation.id };
}

export async function updateReservationManagementAction(
  branchId: string,
  reservationId: string,
  input: ReservationManagementInput,
) {
  const context = await requireReservationActionContext(
    branchId,
    PERMISSION_CODES.RESERVATION_UPDATE,
  );
  validateReservationInput(input);
  await updateManagedReservation(context.user.id, reservationId, { ...input, branchId });
  revalidateReservationPages(branchId, reservationId);
  return { success: true as const };
}

export async function confirmReservationManagementAction(branchId: string, reservationId: string) {
  const context = await requireReservationActionContext(
    branchId,
    PERMISSION_CODES.RESERVATION_UPDATE,
  );
  await confirmManagedReservation(context.user.id, branchId, reservationId);
  revalidateReservationPages(branchId, reservationId);
  return { success: true as const };
}

export async function seatReservationManagementAction(branchId: string, reservationId: string) {
  const context = await requireReservationActionContext(
    branchId,
    PERMISSION_CODES.RESERVATION_UPDATE,
  );
  await seatManagedReservation(context.user.id, branchId, reservationId);
  revalidateReservationPages(branchId, reservationId);
  return { success: true as const };
}

export async function completeReservationManagementAction(branchId: string, reservationId: string) {
  const context = await requireReservationActionContext(
    branchId,
    PERMISSION_CODES.RESERVATION_UPDATE,
  );
  await completeManagedReservation(context.user.id, branchId, reservationId);
  revalidateReservationPages(branchId, reservationId);
  return { success: true as const };
}

export async function cancelReservationManagementAction(branchId: string, reservationId: string) {
  const context = await requireReservationActionContext(
    branchId,
    PERMISSION_CODES.RESERVATION_CANCEL,
  );
  await cancelManagedReservation(context.user.id, branchId, reservationId);
  revalidateReservationPages(branchId, reservationId);
  return { success: true as const };
}

export async function markNoShowReservationManagementAction(
  branchId: string,
  reservationId: string,
) {
  const context = await requireReservationActionContext(
    branchId,
    PERMISSION_CODES.RESERVATION_UPDATE,
  );
  await markNoShowManagedReservation(context.user.id, branchId, reservationId);
  revalidateReservationPages(branchId, reservationId);
  return { success: true as const };
}

export async function deleteReservationManagementAction(branchId: string, reservationId: string) {
  const context = await requireReservationActionContext(
    branchId,
    PERMISSION_CODES.RESERVATION_DELETE,
  );
  await deleteManagedReservation(context.user.id, branchId, reservationId);
  revalidateReservationPages(branchId);
  return { success: true as const };
}

export async function assignTableReservationManagementAction(input: AssignReservationTableInput) {
  const context = await requireReservationActionContext(
    input.branchId,
    PERMISSION_CODES.RESERVATION_ASSIGN_TABLE,
  );
  await assignTableToReservation(context.user.id, input);
  revalidateReservationPages(input.branchId, input.reservationId);
  return { success: true as const };
}

export async function assignStaffReservationManagementAction(input: AssignReservationStaffInput) {
  const context = await requireReservationActionContext(
    input.branchId,
    PERMISSION_CODES.RESERVATION_ASSIGN_STAFF,
  );
  await assignStaffToReservation(context.user.id, input);
  revalidateReservationPages(input.branchId, input.reservationId);
  return { success: true as const };
}

export async function checkTableAvailabilityAction(query: TableAvailabilityQuery) {
  const context = await requireReservationActionContext(
    query.branchId,
    PERMISSION_CODES.RESERVATION_VIEW,
  );
  const slots = await checkTableAvailability(context.user.id, query);
  return { success: true as const, slots };
}
