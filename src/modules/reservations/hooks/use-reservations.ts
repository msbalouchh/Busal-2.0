"use client";

import { useContext } from "react";

import { ReservationContext } from "@/modules/reservations/contexts/reservation-context";
import type { ReservationContextValue } from "@/modules/reservations/types/reservations";

export function useReservationContext(): ReservationContextValue {
  const context = useContext(ReservationContext);

  if (!context) {
    throw new Error("useReservationContext must be used within ReservationProvider");
  }

  return context;
}

export function useReservations(): ReservationContextValue {
  return useReservationContext();
}
