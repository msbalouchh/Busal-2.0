"use client";

import { useMemo } from "react";

import { useReservations } from "@/modules/reservations/hooks/use-reservations";
import { filterByDate } from "@/modules/reservations/utils/reservation-selectors";

export function useReservationCalendar(date: string) {
  const { reservations, refresh, searchReservations, timeSlots } = useReservations();

  const dayReservations = useMemo(() => filterByDate(reservations, date), [reservations, date]);

  return {
    date,
    reservations: dayReservations,
    timeSlots: timeSlots.filter((slot) => slot.date === date),
    searchReservations,
    refresh,
  };
}
