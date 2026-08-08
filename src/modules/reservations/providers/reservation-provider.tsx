"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { ReservationContext } from "@/modules/reservations/contexts/reservation-context";
import {
  buildReservationPlatformContext,
  type ReservationPlatformInput,
} from "@/modules/reservations/lib/reservation-platform-context";
import type { ReservationPlatformSnapshot } from "@/modules/reservations/services/reservation-platform.service";
import type {
  ReservationContextValue,
  ReservationSearchQuery,
} from "@/modules/reservations/types/reservations";

interface ReservationProviderProps {
  children: ReactNode;
  initialInput?: ReservationPlatformInput;
  initialSnapshot?: ReservationPlatformSnapshot;
}

export function ReservationProvider({
  children,
  initialInput,
  initialSnapshot,
}: ReservationProviderProps) {
  const [input] = useState<ReservationPlatformInput>(
    () =>
      initialInput ?? {
        businessId: initialSnapshot?.context.businessId ?? "",
        branchId: initialSnapshot?.context.branchId ?? "",
      },
  );
  const [snapshot, setSnapshot] = useState<ReservationPlatformSnapshot | null>(
    initialSnapshot ?? null,
  );
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setError(null);

    void fetch("/api/reservations?pageSize=100")
      .then(async (response) => {
        const payload = (await response.json()) as {
          success: boolean;
          data?: { snapshot: ReservationPlatformSnapshot };
          error?: string;
        };

        if (!payload.success || !payload.data?.snapshot) {
          throw new Error(payload.error ?? "Failed to refresh reservations");
        }

        setSnapshot(payload.data.snapshot);
      })
      .catch((refreshError: unknown) => {
        setError(refreshError instanceof Error ? refreshError.message : "Refresh failed");
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, []);

  const value = useMemo<ReservationContextValue>(() => {
    const context = snapshot?.context ?? buildReservationPlatformContext(input);
    const reservations = snapshot?.reservations ?? [];
    const selectedReservation = selectedReservationId
      ? (reservations.find((record) => record.reservation.id === selectedReservationId) ?? null)
      : null;

    return {
      context,
      reservations,
      selectedReservation,
      timeSlots: [],
      selectReservation: setSelectedReservationId,
      searchReservations: (query: ReservationSearchQuery) => {
        const normalized = query.query?.toLowerCase() ?? "";
        return reservations.filter((record) => {
          if (query.status && record.reservation.status !== query.status) {
            return false;
          }
          if (query.date && record.reservation.scheduledDate !== query.date) {
            return false;
          }
          if (!normalized) {
            return true;
          }
          const haystack = [
            record.reservation.confirmationCode,
            record.guest.firstName,
            record.guest.lastName,
            record.guest.email ?? "",
            record.guest.phone ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(normalized);
        });
      },
      refresh,
      isRefreshing,
      error,
    };
  }, [input, snapshot, selectedReservationId, refresh, isRefreshing, error]);

  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>;
}
