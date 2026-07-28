"use client";

import type { ReservationStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  formatDateTime,
  formatReservationDate,
  formatSourceLabel,
  formatStatusLabel,
  type ClientReservation,
} from "@/modules/reservations/lib/reservation-utils";

interface ReservationDetailsProps {
  reservation: ClientReservation | null;
  isPending: boolean;
  onEdit: (reservation: ClientReservation) => void;
  onCancel: (reservationId: string) => void;
  onStatusUpdate: (reservationId: string, status: ReservationStatus) => void;
}

function getStatusActions(status: ReservationStatus): { label: string; next: ReservationStatus }[] {
  switch (status) {
    case "PENDING":
      return [{ label: "Confirm", next: "CONFIRMED" }];
    case "CONFIRMED":
      return [
        { label: "Mark Seated", next: "SEATED" },
        { label: "No Show", next: "NO_SHOW" },
      ];
    case "SEATED":
      return [{ label: "Complete", next: "COMPLETED" }];
    default:
      return [];
  }
}

function canCancel(status: ReservationStatus): boolean {
  return status !== "CANCELLED" && status !== "COMPLETED";
}

export function ReservationDetails({
  reservation,
  isPending,
  onEdit,
  onCancel,
  onStatusUpdate,
}: ReservationDetailsProps) {
  if (!reservation) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-muted-foreground text-sm">Select a reservation to view details.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold">Reservation details</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit(reservation)}
            disabled={isPending}
          >
            Edit
          </Button>
        </div>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Reservation Number</dt>
            <dd className="font-medium">{reservation.reservationNumber}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Customer Name</dt>
            <dd>{reservation.customerName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{reservation.customerPhone}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{reservation.customerEmail || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Party Size</dt>
            <dd>{reservation.partySize}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Date</dt>
            <dd>{formatReservationDate(reservation.reservationDate)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Start Time</dt>
            <dd>{reservation.startTime}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">End Time</dt>
            <dd>{reservation.endTime}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd>{formatStatusLabel(reservation.status)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Source</dt>
            <dd>{formatSourceLabel(reservation.source)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Notes</dt>
            <dd>{reservation.notes || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Created By</dt>
            <dd>
              {reservation.createdByStaff
                ? `${reservation.createdByStaff.firstName} ${reservation.createdByStaff.lastName}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Created At</dt>
            <dd>{formatDateTime(reservation.createdAt)}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          {getStatusActions(reservation.status).map((action) => (
            <Button
              key={action.next}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onStatusUpdate(reservation.id, action.next)}
              disabled={isPending}
            >
              {action.label}
            </Button>
          ))}
          {canCancel(reservation.status) ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onCancel(reservation.id)}
              disabled={isPending}
            >
              Cancel reservation
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
