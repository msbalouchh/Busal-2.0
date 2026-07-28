"use server";

import type { ReservationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { RESERVATION_ROUTES } from "@/modules/reservations/constants/routes";
import { requireAuthenticatedUser } from "@/modules/onboarding/lib/onboarding-guard";
import {
  cancelReservation,
  createReservation,
  updateReservation,
  updateReservationStatus,
  type CreateReservationInput,
  type UpdateReservationInput,
} from "@/services/reservation.service";

function revalidateReservationPages() {
  revalidatePath(RESERVATION_ROUTES.overview);
}

export async function createReservationAction(input: CreateReservationInput) {
  const user = await requireAuthenticatedUser();
  await createReservation(user.id, input);
  revalidateReservationPages();
  return { success: true as const };
}

export async function updateReservationAction(
  reservationId: string,
  input: UpdateReservationInput,
) {
  const user = await requireAuthenticatedUser();
  await updateReservation(user.id, reservationId, input);
  revalidateReservationPages();
  return { success: true as const };
}

export async function cancelReservationAction(reservationId: string) {
  const user = await requireAuthenticatedUser();
  await cancelReservation(user.id, reservationId);
  revalidateReservationPages();
  return { success: true as const };
}

export async function updateReservationStatusAction(
  reservationId: string,
  status: ReservationStatus,
) {
  const user = await requireAuthenticatedUser();
  await updateReservationStatus(user.id, reservationId, status);
  revalidateReservationPages();
  return { success: true as const };
}
