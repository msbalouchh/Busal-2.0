"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CUSTOMER_PORTAL_ROUTES } from "@/modules/customer-portal/constants/routes";
import { formatPortalDate } from "@/modules/customer-portal/components/customer-portal-format";

import type { CustomerReservationList } from "@/modules/customer-portal/types/customer-portal";

interface CustomerPortalReservationsPanelProps {
  reservations: CustomerReservationList;
}

export function CustomerPortalReservationsPanel({
  reservations,
}: CustomerPortalReservationsPanelProps) {
  if (reservations.length === 0) {
    return (
      <EmptyState
        title="No reservations"
        description="Your table reservations will appear here."
        icon={<Calendar className="text-muted-foreground h-6 w-6" />}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {reservations.map((reservation) => (
        <Card key={reservation.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <Link
                href={CUSTOMER_PORTAL_ROUTES.reservationDetail(reservation.id)}
                className="hover:underline"
              >
                {reservation.reservationNumber}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">{formatPortalDate(reservation.scheduledAt)}</p>
            <p>Party of {reservation.partySize}</p>
            <p className="text-muted-foreground">{reservation.branchName}</p>
            <Badge variant="secondary">{reservation.status}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
