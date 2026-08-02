import type { Metadata } from "next";

import { RestaurantReservationsPanel } from "@/modules/restaurant-operations/components/restaurant-reservations-panel";
import { getRestaurantReservationsContext } from "@/modules/restaurant-operations/lib/get-restaurant-operations-context";

export const metadata: Metadata = {
  title: "Reservations",
};

export default async function RestaurantReservationsPage() {
  const { reservations, waitlist, calendarDays } = await getRestaurantReservationsContext({
    view: "calendar",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reservations</h1>
        <p className="text-muted-foreground text-sm">
          Calendar, daily and weekly views, booking details, confirmations, and waitlist.
        </p>
      </div>
      <RestaurantReservationsPanel
        reservations={reservations}
        waitlist={waitlist}
        calendarDays={calendarDays}
      />
    </div>
  );
}
