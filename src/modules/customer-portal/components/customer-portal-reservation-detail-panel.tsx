"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPortalDate } from "@/modules/customer-portal/components/customer-portal-format";

import type { CustomerReservationDetail } from "@/modules/customer-portal/types/customer-portal";

interface CustomerPortalReservationDetailPanelProps {
  reservation: CustomerReservationDetail;
}

export function CustomerPortalReservationDetailPanel({
  reservation,
}: CustomerPortalReservationDetailPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{reservation.reservationNumber}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="space-y-2">
          <p>
            <span className="text-muted-foreground">Scheduled:</span>{" "}
            {formatPortalDate(reservation.scheduledAt)}
          </p>
          <p>
            <span className="text-muted-foreground">Party size:</span> {reservation.partySize}
          </p>
          <p>
            <span className="text-muted-foreground">Branch:</span> {reservation.branchName}
          </p>
          {reservation.branchAddress ? (
            <p>
              <span className="text-muted-foreground">Address:</span> {reservation.branchAddress}
            </p>
          ) : null}
          {reservation.tableNumber ? (
            <p>
              <span className="text-muted-foreground">Table:</span> {reservation.tableNumber}
            </p>
          ) : null}
          <Badge variant="secondary">{reservation.status}</Badge>
        </div>
        <div className="space-y-2">
          {reservation.guestName ? (
            <p>
              <span className="text-muted-foreground">Guest:</span> {reservation.guestName}
            </p>
          ) : null}
          {reservation.guestPhone ? (
            <p>
              <span className="text-muted-foreground">Phone:</span> {reservation.guestPhone}
            </p>
          ) : null}
          {reservation.guestEmail ? (
            <p>
              <span className="text-muted-foreground">Email:</span> {reservation.guestEmail}
            </p>
          ) : null}
          {reservation.startTime ? (
            <p>
              <span className="text-muted-foreground">Time:</span> {reservation.startTime}
              {reservation.endTime ? ` – ${reservation.endTime}` : ""}
            </p>
          ) : null}
          {reservation.specialRequests ? (
            <p>
              <span className="text-muted-foreground">Requests:</span> {reservation.specialRequests}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
