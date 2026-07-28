import type { Metadata } from "next";

import { ReservationPageHeader } from "@/modules/reservations/components/reservation-page-header";
import { ReservationsManager } from "@/modules/reservations/components/reservations-manager";
import { ReservationsOverview } from "@/modules/reservations/components/reservations-overview";
import { getReservationModuleContext } from "@/modules/reservations/lib/get-reservation-context";
import {
  computeReservationStats,
  serializeReservation,
} from "@/modules/reservations/lib/reservation-utils";

export const metadata: Metadata = {
  title: "Reservations",
};

export default async function ReservationsPage() {
  const { reservations } = await getReservationModuleContext();
  const clientReservations = reservations.map(serializeReservation);
  const stats = computeReservationStats(clientReservations);

  return (
    <div className="space-y-6">
      <ReservationPageHeader
        title="Reservations"
        description="Manage bookings, track status, and view reservation details."
      />
      <ReservationsOverview stats={stats} />
      <ReservationsManager reservations={clientReservations} />
    </div>
  );
}
