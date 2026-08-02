"use client";

import Link from "next/link";

import { ReservationStatusBadge } from "@/modules/reservation-management/components/reservation-status-badge";
import { RESERVATION_MANAGEMENT_ROUTES } from "@/modules/reservation-management/constants/routes";
import type { CalendarReservationEntry } from "@/modules/reservation-management/types/reservation-management-types";

interface ReservationCalendarViewProps {
  branchId: string;
  entries: CalendarReservationEntry[];
  referenceDate: string;
}

function buildWeekDays(referenceDate: string): string[] {
  const date = new Date(`${referenceDate}T00:00:00.000Z`);
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const days: string[] = [];

  for (let index = 0; index < 7; index += 1) {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + mondayOffset + index);
    days.push(next.toISOString().slice(0, 10));
  }

  return days;
}

export function ReservationCalendarView({
  branchId,
  entries,
  referenceDate,
}: ReservationCalendarViewProps) {
  const weekDays = buildWeekDays(referenceDate);

  return (
    <div className="overflow-x-auto rounded-xl border">
      <div className="grid min-w-[960px] grid-cols-7 divide-x">
        {weekDays.map((day) => {
          const dayEntries = entries.filter((entry) => entry.reservationDate === day);
          const label = new Date(`${day}T00:00:00.000Z`).toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          });

          return (
            <div key={day} className="min-h-72 space-y-3 p-3">
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-muted-foreground text-xs">{dayEntries.length} bookings</p>
              </div>
              <div className="space-y-2">
                {dayEntries.map((entry) => (
                  <Link
                    key={entry.id}
                    href={RESERVATION_MANAGEMENT_ROUTES.details(entry.id, branchId)}
                    className="hover:bg-muted block rounded-lg border p-2 transition-colors"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{entry.guestName}</p>
                      <ReservationStatusBadge status={entry.status} />
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {entry.startTime} – {entry.endTime}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Party of {entry.partySize}
                      {entry.tableLabel ? ` · ${entry.tableLabel}` : ""}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
