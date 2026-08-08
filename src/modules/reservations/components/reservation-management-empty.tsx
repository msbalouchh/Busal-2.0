import { CalendarX2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ReservationManagementEmptyProps {
  onCreate?: () => void;
}

export function ReservationManagementEmpty({ onCreate }: ReservationManagementEmptyProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border p-6 text-center">
      <CalendarX2 className="text-muted-foreground h-8 w-8" />
      <div>
        <p className="font-medium">No reservations yet</p>
        <p className="text-muted-foreground text-sm">
          Create a reservation to start managing bookings for this branch.
        </p>
      </div>
      {onCreate ? (
        <Button type="button" onClick={onCreate}>
          New reservation
        </Button>
      ) : null}
    </div>
  );
}
