"use client";

import Link from "next/link";
import { Loader2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  assignStaffReservationManagementAction,
  assignTableReservationManagementAction,
  cancelReservationManagementAction,
  completeReservationManagementAction,
  confirmReservationManagementAction,
  deleteReservationManagementAction,
  markNoShowReservationManagementAction,
  seatReservationManagementAction,
} from "@/modules/reservation-management/actions/reservation-management-actions";
import { ReservationStatusBadge } from "@/modules/reservation-management/components/reservation-status-badge";
import { RESERVATION_MANAGEMENT_ROUTES } from "@/modules/reservation-management/constants/routes";
import type { ReservationManagementPermissions } from "@/modules/reservation-management/lib/get-reservation-management-context";
import type { ReservationManagementRecord } from "@/modules/reservation-management/types/reservation-management-types";

interface ReservationDetailsPanelProps {
  branchId: string;
  reservation: ReservationManagementRecord;
  permissionsFlags: ReservationManagementPermissions;
  tables: { id: string; label: string; capacity: number }[];
  staff: { id: string; label: string }[];
}

export function ReservationDetailsPanel({
  branchId,
  reservation,
  permissionsFlags,
  tables,
  staff,
}: ReservationDetailsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTableId, setSelectedTableId] = useState(reservation.restaurantTableId ?? "");
  const [selectedStaffId, setSelectedStaffId] = useState(reservation.assignedStaffId ?? "");

  const runAction = (action: () => Promise<{ success: boolean }>, successMessage: string) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle>{reservation.guestName}</CardTitle>
            <p className="text-muted-foreground text-sm">{reservation.reservationNumber}</p>
            <ReservationStatusBadge status={reservation.status} />
          </div>
          {permissionsFlags.canUpdate ? (
            <Button asChild variant="outline" size="sm">
              <Link href={RESERVATION_MANAGEMENT_ROUTES.edit(reservation.id, branchId)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Phone" value={reservation.guestPhone} />
          <DetailItem label="Email" value={reservation.guestEmail ?? "—"} />
          <DetailItem
            label="Date & time"
            value={`${reservation.reservationDate} · ${reservation.startTime} – ${reservation.endTime}`}
          />
          <DetailItem label="Party size" value={String(reservation.partySize)} />
          <DetailItem label="Source" value={reservation.source.replace("_", " ")} />
          <DetailItem
            label="Table"
            value={
              reservation.restaurantTable
                ? `${reservation.restaurantTable.floorName} · ${
                    reservation.restaurantTable.tableName ?? reservation.restaurantTable.tableNumber
                  }`
                : "Unassigned"
            }
          />
          <DetailItem
            label="Assigned staff"
            value={
              reservation.assignedStaff
                ? reservation.assignedStaff.fullName ||
                  `${reservation.assignedStaff.firstName} ${reservation.assignedStaff.lastName}`
                : "Unassigned"
            }
          />
          <DetailItem label="Customer profile" value={reservation.customer?.name ?? "Not linked"} />
          <DetailItem label="Special requests" value={reservation.specialRequests ?? "—"} />
          <DetailItem label="Notes" value={reservation.notes ?? "—"} />
          <DetailItem label="Check-in" value={formatDateTime(reservation.checkInTime)} />
          <DetailItem label="Check-out" value={formatDateTime(reservation.checkOutTime)} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {permissionsFlags.canUpdate && reservation.status === "PENDING" ? (
              <Button
                className="w-full"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => confirmReservationManagementAction(branchId, reservation.id),
                    "Reservation confirmed",
                  )
                }
              >
                Confirm
              </Button>
            ) : null}
            {permissionsFlags.canUpdate && ["PENDING", "CONFIRMED"].includes(reservation.status) ? (
              <Button
                className="w-full"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => seatReservationManagementAction(branchId, reservation.id),
                    "Guest seated",
                  )
                }
              >
                Seat guest
              </Button>
            ) : null}
            {permissionsFlags.canUpdate && reservation.status === "SEATED" ? (
              <Button
                className="w-full"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => completeReservationManagementAction(branchId, reservation.id),
                    "Reservation completed",
                  )
                }
              >
                Complete
              </Button>
            ) : null}
            {permissionsFlags.canCancel &&
            !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(reservation.status) ? (
              <Button
                className="w-full"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => cancelReservationManagementAction(branchId, reservation.id),
                    "Reservation cancelled",
                  )
                }
              >
                Cancel
              </Button>
            ) : null}
            {permissionsFlags.canUpdate && reservation.status === "CONFIRMED" ? (
              <Button
                className="w-full"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => markNoShowReservationManagementAction(branchId, reservation.id),
                    "Marked as no-show",
                  )
                }
              >
                Mark no-show
              </Button>
            ) : null}
            {permissionsFlags.canDelete ? (
              <Button
                className="w-full"
                variant="destructive"
                disabled={isPending}
                onClick={() =>
                  runAction(async () => {
                    await deleteReservationManagementAction(branchId, reservation.id);
                    router.push(RESERVATION_MANAGEMENT_ROUTES.listForBranch(branchId));
                    return { success: true };
                  }, "Reservation deleted")
                }
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete
              </Button>
            ) : null}
          </CardContent>
        </Card>

        {permissionsFlags.canAssignTable ? (
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Assign table</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={selectedTableId}
                onChange={(event) => setSelectedTableId(event.target.value)}
                disabled={isPending}
              >
                <option value="">Select table</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.label}
                  </option>
                ))}
              </select>
              <Button
                className="w-full"
                disabled={isPending || !selectedTableId}
                onClick={() =>
                  runAction(
                    () =>
                      assignTableReservationManagementAction({
                        branchId,
                        reservationId: reservation.id,
                        restaurantTableId: selectedTableId,
                      }),
                    "Table assigned",
                  )
                }
              >
                Assign table
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {permissionsFlags.canAssignStaff ? (
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Assign staff</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={selectedStaffId}
                onChange={(event) => setSelectedStaffId(event.target.value)}
                disabled={isPending}
              >
                <option value="">Unassigned</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.label}
                  </option>
                ))}
              </select>
              <Button
                className="w-full"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () =>
                      assignStaffReservationManagementAction({
                        branchId,
                        reservationId: reservation.id,
                        assignedStaffId: selectedStaffId || null,
                      }),
                    "Staff assigned",
                  )
                }
              >
                Assign staff
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs tracking-wide uppercase">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}
