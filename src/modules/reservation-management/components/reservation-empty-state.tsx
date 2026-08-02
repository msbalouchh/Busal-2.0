import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RESERVATION_MANAGEMENT_ROUTES } from "@/modules/reservation-management/constants/routes";

interface ReservationEmptyStateProps {
  branchId: string;
  canCreate: boolean;
}

export function ReservationEmptyState({ branchId, canCreate }: ReservationEmptyStateProps) {
  return (
    <Card className="rounded-xl border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
        <CalendarDays className="text-muted-foreground h-10 w-10" />
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">No reservations yet</h3>
          <p className="text-muted-foreground max-w-md text-sm">
            Create your first reservation to start managing guest bookings, table assignments, and
            seating flow.
          </p>
        </div>
        {canCreate ? (
          <Button asChild>
            <Link href={RESERVATION_MANAGEMENT_ROUTES.create(branchId)}>
              <Plus className="mr-2 h-4 w-4" />
              Create reservation
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
