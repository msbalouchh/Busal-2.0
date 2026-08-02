"use client";

import Link from "next/link";

import { ReservationStatusBadge } from "@/modules/reservation-management/components/reservation-status-badge";
import { RESERVATION_MANAGEMENT_ROUTES } from "@/modules/reservation-management/constants/routes";
import type { CalendarReservationEntry } from "@/modules/reservation-management/types/reservation-management-types";
import {
  buildTimelineHours,
  reservationTimelineOffset,
} from "@/modules/reservation-management/lib/reservation-validation";

interface ReservationTimelineViewProps {
  branchId: string;
  entries: CalendarReservationEntry[];
  referenceDate: string;
}

const TIMELINE_START_HOUR = 8;
const TIMELINE_END_HOUR = 23;
const MINUTE_WIDTH = 1.2;

export function ReservationTimelineView({
  branchId,
  entries,
  referenceDate,
}: ReservationTimelineViewProps) {
  const hours = buildTimelineHours(TIMELINE_START_HOUR, TIMELINE_END_HOUR);
  const dayEntries = entries.filter((entry) => entry.reservationDate === referenceDate);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border">
        <div className="min-w-[960px]">
          <div className="bg-muted/40 grid grid-cols-[80px_1fr] border-b">
            <div className="p-3 text-sm font-medium">Time</div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${hours.length}, 1fr)` }}>
              {hours.map((hour) => (
                <div key={hour} className="text-muted-foreground border-l p-2 text-xs">
                  {hour}
                </div>
              ))}
            </div>
          </div>

          {dayEntries.length === 0 ? (
            <p className="text-muted-foreground p-6 text-sm">
              No reservations scheduled for this day.
            </p>
          ) : (
            dayEntries.map((entry) => {
              const offset = reservationTimelineOffset(entry.startTime, TIMELINE_START_HOUR);
              const duration =
                reservationTimelineOffset(entry.endTime, TIMELINE_START_HOUR) - offset;

              return (
                <div key={entry.id} className="grid grid-cols-[80px_1fr] border-b last:border-b-0">
                  <div className="p-3 text-sm font-medium">{entry.guestName}</div>
                  <div className="relative min-h-16 p-2">
                    <Link
                      href={RESERVATION_MANAGEMENT_ROUTES.details(entry.id, branchId)}
                      className="bg-primary/10 hover:bg-primary/15 absolute top-2 rounded-md border px-3 py-2 transition-colors"
                      style={{
                        left: `${offset * MINUTE_WIDTH}px`,
                        width: `${Math.max(duration * MINUTE_WIDTH, 96)}px`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{entry.guestName}</p>
                        <ReservationStatusBadge status={entry.status} />
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {entry.startTime} – {entry.endTime} · party of {entry.partySize}
                      </p>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
