"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { ReservationContext } from "@/modules/reservations/contexts/reservation-context";
import { reservationRepository } from "@/modules/reservations/repository/reservation-repository";
import {
  buildReservationPlatformContext,
  buildReservationPlatformSnapshot,
  type ReservationPlatformInput,
} from "@/modules/reservations/services/reservation-platform.service";
import type {
  ReservationContextValue,
  ReservationSearchQuery,
} from "@/modules/reservations/types/reservations";

interface ReservationProviderProps {
  children: ReactNode;
  initialInput?: ReservationPlatformInput;
}

export function ReservationProvider({ children, initialInput }: ReservationProviderProps) {
  const [input] = useState<ReservationPlatformInput>(() => initialInput ?? {});
  const [snapshot, setSnapshot] = useState(() => buildReservationPlatformSnapshot(input));
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSnapshot(buildReservationPlatformSnapshot(input));
  }, [input]);

  const value = useMemo<ReservationContextValue>(() => {
    const context = buildReservationPlatformContext(input);
    const selectedReservation = selectedReservationId
      ? (reservationRepository.findById(selectedReservationId) ?? null)
      : null;

    return {
      context,
      reservations: snapshot.reservations,
      selectedReservation,
      timeSlots: reservationRepository.listTimeSlots(),
      selectReservation: setSelectedReservationId,
      searchReservations: (query: ReservationSearchQuery) =>
        reservationRepository.search({
          ...query,
          tenantId: query.tenantId ?? context.tenantId,
          businessId: query.businessId ?? context.businessId,
          branchId: query.branchId ?? context.branchId,
        }),
      refresh,
    };
  }, [input, snapshot, selectedReservationId, refresh]);

  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>;
}
