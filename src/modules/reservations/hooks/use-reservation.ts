"use client";

import { useMemo } from "react";

import { useReservations } from "@/modules/reservations/hooks/use-reservations";
import { reservationService } from "@/modules/reservations/services/reservation.service";

export function useReservation(reservationId: string | null) {
  const { selectedReservation, selectReservation, refresh } = useReservations();

  const reservation = useMemo(() => {
    if (!reservationId) return selectedReservation;
    return reservationService.getById(reservationId) ?? null;
  }, [reservationId, selectedReservation]);

  return {
    reservation,
    selectReservation,
    refresh,
  };
}
