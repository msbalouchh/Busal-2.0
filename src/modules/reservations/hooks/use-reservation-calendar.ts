"use client";

import { useMemo } from "react";

import { useReservations } from "@/modules/reservations/hooks/use-reservations";
import { reservationService } from "@/modules/reservations/services/reservation.service";
import { filterByDate } from "@/modules/reservations/utils/reservation-selectors";

export function useReservationCalendar(date: string) {
  const { reservations, refresh, searchReservations } = useReservations();

  const dayReservations = useMemo(() => filterByDate(reservations, date), [reservations, date]);

  const timeSlots = useMemo(() => reservationService.listTimeSlots(), []);

  return {
    date,
    reservations: dayReservations,
    timeSlots: timeSlots.filter((slot) => slot.date === date),
    searchReservations,
    refresh,
  };
}
