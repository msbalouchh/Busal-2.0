"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TableAvailabilitySlot } from "@/modules/reservation-management/types/reservation-management-types";
import { checkTableAvailabilityAction } from "@/modules/reservation-management/actions/reservation-management-actions";
import { RESERVATION_SOURCE_OPTIONS } from "@/modules/reservation-management/constants/routes";
import { TableAvailabilityPanel } from "@/modules/reservation-management/components/table-availability-panel";
import type { ReservationManagementInput } from "@/modules/reservation-management/types/reservation-management-types";

interface ReservationFormProps {
  branchId: string;
  initialReservation?: Partial<ReservationManagementInput>;
  tables: { id: string; label: string; capacity: number }[];
  staff: { id: string; label: string }[];
  customers: { id: string; label: string; phone: string | null }[];
  submitLabel: string;
  disabled?: boolean;
  reservationId?: string;
  onSubmit: (input: ReservationManagementInput) => Promise<void>;
}

export function ReservationForm({
  branchId,
  initialReservation,
  tables,
  staff,
  customers,
  submitLabel,
  disabled = false,
  reservationId,
  onSubmit,
}: ReservationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ReservationManagementInput>({
    branchId,
    guestName: initialReservation?.guestName ?? "",
    guestPhone: initialReservation?.guestPhone ?? "",
    guestEmail: initialReservation?.guestEmail ?? "",
    customerId: initialReservation?.customerId ?? null,
    restaurantTableId: initialReservation?.restaurantTableId ?? null,
    assignedStaffId: initialReservation?.assignedStaffId ?? null,
    partySize: initialReservation?.partySize ?? 2,
    reservationDate: initialReservation?.reservationDate ?? new Date().toISOString().slice(0, 10),
    startTime: initialReservation?.startTime ?? "18:00",
    endTime: initialReservation?.endTime ?? "19:30",
    source: initialReservation?.source ?? "PHONE",
    specialRequests: initialReservation?.specialRequests ?? "",
    notes: initialReservation?.notes ?? "",
  });

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((entry) => entry.id === customerId);

    setForm((current) => ({
      ...current,
      customerId: customerId || null,
      guestName: customer?.label ?? current.guestName,
      guestPhone: customer?.phone ?? current.guestPhone,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      try {
        await onSubmit(form);
        toast.success(
          submitLabel === "Create reservation" ? "Reservation created" : "Reservation updated",
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed");
      }
    });
  };

  const refreshAvailability = () => {
    startTransition(async () => {
      try {
        const result = await checkTableAvailabilityAction({
          branchId,
          reservationDate: form.reservationDate,
          startTime: form.startTime,
          endTime: form.endTime,
          partySize: form.partySize,
          excludeReservationId: reservationId,
        });

        if (result.success) {
          setAvailability(result.slots);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Availability check failed");
      }
    });
  };

  const [availability, setAvailability] = useState<TableAvailabilitySlot[]>([]);

  useEffect(() => {
    refreshAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.reservationDate, form.startTime, form.endTime, form.partySize, branchId]);

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="reservation-customer">Link customer (optional)</Label>
            <select
              id="reservation-customer"
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              value={form.customerId ?? ""}
              onChange={(event) => handleCustomerChange(event.target.value)}
              disabled={disabled || isPending}
            >
              <option value="">Walk-in / new guest</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="guest-name">Guest name</Label>
            <Input
              id="guest-name"
              value={form.guestName}
              onChange={(event) =>
                setForm((current) => ({ ...current, guestName: event.target.value }))
              }
              disabled={disabled || isPending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guest-phone">Guest phone</Label>
            <Input
              id="guest-phone"
              value={form.guestPhone}
              onChange={(event) =>
                setForm((current) => ({ ...current, guestPhone: event.target.value }))
              }
              disabled={disabled || isPending}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="guest-email">Guest email</Label>
            <Input
              id="guest-email"
              type="email"
              value={form.guestEmail ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, guestEmail: event.target.value }))
              }
              disabled={disabled || isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="party-size">Party size</Label>
            <Input
              id="party-size"
              type="number"
              min={1}
              max={100}
              value={form.partySize}
              onChange={(event) =>
                setForm((current) => ({ ...current, partySize: Number(event.target.value) }))
              }
              disabled={disabled || isPending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reservation-source">Source</Label>
            <select
              id="reservation-source"
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              value={form.source}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  source: event.target.value as ReservationManagementInput["source"],
                }))
              }
              disabled={disabled || isPending}
            >
              {RESERVATION_SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reservation-date">Date</Label>
            <Input
              id="reservation-date"
              type="date"
              value={form.reservationDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, reservationDate: event.target.value }))
              }
              disabled={disabled || isPending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="start-time">Start time</Label>
            <Input
              id="start-time"
              type="time"
              value={form.startTime}
              onChange={(event) =>
                setForm((current) => ({ ...current, startTime: event.target.value }))
              }
              disabled={disabled || isPending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time">End time</Label>
            <Input
              id="end-time"
              type="time"
              value={form.endTime}
              onChange={(event) =>
                setForm((current) => ({ ...current, endTime: event.target.value }))
              }
              disabled={disabled || isPending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assigned-table">Table</Label>
            <select
              id="assigned-table"
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              value={form.restaurantTableId ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  restaurantTableId: event.target.value || null,
                }))
              }
              disabled={disabled || isPending}
            >
              <option value="">Assign later</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assigned-staff">Assigned staff</Label>
            <select
              id="assigned-staff"
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              value={form.assignedStaffId ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  assignedStaffId: event.target.value || null,
                }))
              }
              disabled={disabled || isPending}
            >
              <option value="">Unassigned</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="special-requests">Special requests</Label>
            <textarea
              id="special-requests"
              value={form.specialRequests ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, specialRequests: event.target.value }))
              }
              className="border-input bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm"
              disabled={disabled || isPending}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="reservation-notes">Internal notes</Label>
            <textarea
              id="reservation-notes"
              value={form.notes ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              className="border-input bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm"
              disabled={disabled || isPending}
            />
          </div>
        </div>
        <Button type="submit" disabled={disabled || isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </form>

      <TableAvailabilityPanel
        slots={availability}
        selectedTableId={form.restaurantTableId}
        onSelectTable={(tableId) =>
          setForm((current) => ({ ...current, restaurantTableId: tableId }))
        }
        onRefresh={refreshAvailability}
        isRefreshing={isPending}
      />
    </div>
  );
}
