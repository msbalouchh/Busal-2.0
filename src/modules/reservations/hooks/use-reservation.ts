"use client";

import { useMemo } from "react";

import { useReservations } from "@/modules/reservations/hooks/use-reservations";

export function useReservation(reservationId: string | null) {
  const { selectedReservation, selectReservation, refresh, reservations } = useReservations();

  const reservation = useMemo(() => {
    if (!reservationId) {
      return selectedReservation;
    }

    return reservations.find((record) => record.reservation.id === reservationId) ?? null;
  }, [reservationId, selectedReservation, reservations]);

  return {
    reservation,
    selectReservation,
    refresh,
  };
}
