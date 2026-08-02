"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReservationsManager } from "@/modules/reservations/components/reservations-manager";
import type { ClientReservation } from "@/modules/reservations/lib/reservation-utils";
import {
  formatReservationDate,
  getReservationDateKey,
} from "@/modules/reservations/lib/reservation-utils";

interface RestaurantReservationsPanelProps {
  reservations: ClientReservation[];
  waitlist: ClientReservation[];
  calendarDays: Array<{ date: string; count: number }>;
}

export function RestaurantReservationsPanel({
  reservations,
  waitlist,
  calendarDays,
}: RestaurantReservationsPanelProps) {
  const [view, setView] = useState<"calendar" | "daily" | "weekly" | "waitlist">("calendar");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const filteredReservations = useMemo(() => {
    if (view === "waitlist") {
      return waitlist;
    }

    if (view === "daily") {
      return reservations.filter(
        (reservation) => getReservationDateKey(reservation.reservationDate) === selectedDate,
      );
    }

    if (view === "weekly") {
      const anchor = new Date(`${selectedDate}T00:00:00.000Z`);
      const day = anchor.getUTCDay();
      const diff = day === 0 ? -6 : 1 - day;
      const weekStart = new Date(anchor);
      weekStart.setUTCDate(anchor.getUTCDate() + diff);
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

      return reservations.filter((reservation) => {
        const date = new Date(reservation.reservationDate);
        return date >= weekStart && date <= weekEnd;
      });
    }

    return reservations;
  }, [reservations, waitlist, selectedDate, view]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(["calendar", "daily", "weekly", "waitlist"] as const).map((mode) => (
          <Button
            key={mode}
            type="button"
            variant={view === mode ? "default" : "outline"}
            onClick={() => setView(mode)}
          >
            {mode === "calendar"
              ? "Calendar"
              : mode === "daily"
                ? "Daily"
                : mode === "weekly"
                  ? "Weekly"
                  : "Waitlist"}
          </Button>
        ))}
      </div>

      {view !== "waitlist" ? (
        <div className="max-w-xs space-y-2">
          <Label htmlFor="reservation-date">Reference date</Label>
          <Input
            id="reservation-date"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </div>
      ) : null}

      {view === "calendar" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {calendarDays.length === 0 ? (
            <p className="text-muted-foreground text-sm">No reservations scheduled.</p>
          ) : (
            calendarDays.map((day) => (
              <button
                key={day.date}
                type="button"
                className="hover:bg-muted/40 rounded-lg border p-4 text-left"
                onClick={() => {
                  setSelectedDate(day.date);
                  setView("daily");
                }}
              >
                <p className="font-medium">{formatReservationDate(`${day.date}T00:00:00.000Z`)}</p>
                <p className="text-muted-foreground text-sm">{day.count} booking(s)</p>
              </button>
            ))
          )}
        </div>
      ) : null}

      {view === "waitlist" ? (
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Waitlist</h2>
          {waitlist.length === 0 ? (
            <p className="text-muted-foreground text-sm">No guests on the waitlist.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {waitlist.map((entry) => (
                <li key={entry.id}>
                  {entry.customerName} · party of {entry.partySize} · {entry.startTime}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {view !== "calendar" ? <ReservationsManager reservations={filteredReservations} /> : null}
    </div>
  );
}
