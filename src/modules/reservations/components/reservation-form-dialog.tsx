"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RESERVATION_SOURCE_OPTIONS } from "@/modules/reservations/constants/routes";
import {
  RESERVATION_SELECT_CLASSNAME,
  buildReservationPayload,
  validateReservationForm,
  type ReservationFormErrors,
  type ReservationFormState,
} from "@/modules/reservations/lib/reservation-form";

interface ReservationFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  initialForm: ReservationFormState;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (form: ReservationFormState) => void;
}

export function ReservationFormDialog({
  open,
  mode,
  initialForm,
  isPending,
  onOpenChange,
  onSubmit,
}: ReservationFormDialogProps) {
  const [form, setForm] = useState<ReservationFormState>(initialForm);
  const [errors, setErrors] = useState<ReservationFormErrors>({});

  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setErrors({});
    }
  }, [open, initialForm]);

  const handleSubmit = () => {
    const nextErrors = validateReservationForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create reservation" : "Edit reservation"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new booking for your business."
              : "Update the reservation details below."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dialog-customer-name">Customer name</Label>
            <Input
              id="dialog-customer-name"
              value={form.customerName}
              onChange={(event) => setForm({ ...form, customerName: event.target.value })}
              disabled={isPending}
              aria-invalid={Boolean(errors.customerName)}
            />
            {errors.customerName ? (
              <p className="text-destructive text-xs">{errors.customerName}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dialog-customer-phone">Phone</Label>
            <Input
              id="dialog-customer-phone"
              value={form.customerPhone}
              onChange={(event) => setForm({ ...form, customerPhone: event.target.value })}
              disabled={isPending}
              aria-invalid={Boolean(errors.customerPhone)}
            />
            {errors.customerPhone ? (
              <p className="text-destructive text-xs">{errors.customerPhone}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dialog-customer-email">Email</Label>
            <Input
              id="dialog-customer-email"
              type="email"
              value={form.customerEmail}
              onChange={(event) => setForm({ ...form, customerEmail: event.target.value })}
              disabled={isPending}
              aria-invalid={Boolean(errors.customerEmail)}
            />
            {errors.customerEmail ? (
              <p className="text-destructive text-xs">{errors.customerEmail}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dialog-reservation-date">Date</Label>
            <Input
              id="dialog-reservation-date"
              type="date"
              value={form.reservationDate}
              onChange={(event) => setForm({ ...form, reservationDate: event.target.value })}
              disabled={isPending}
              aria-invalid={Boolean(errors.reservationDate)}
            />
            {errors.reservationDate ? (
              <p className="text-destructive text-xs">{errors.reservationDate}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dialog-start-time">Start time</Label>
            <Input
              id="dialog-start-time"
              type="time"
              value={form.startTime}
              onChange={(event) => setForm({ ...form, startTime: event.target.value })}
              disabled={isPending}
              aria-invalid={Boolean(errors.startTime)}
            />
            {errors.startTime ? (
              <p className="text-destructive text-xs">{errors.startTime}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dialog-end-time">End time</Label>
            <Input
              id="dialog-end-time"
              type="time"
              value={form.endTime}
              onChange={(event) => setForm({ ...form, endTime: event.target.value })}
              disabled={isPending}
              aria-invalid={Boolean(errors.endTime)}
            />
            {errors.endTime ? <p className="text-destructive text-xs">{errors.endTime}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dialog-party-size">Party size</Label>
            <Input
              id="dialog-party-size"
              type="number"
              min="1"
              value={form.partySize}
              onChange={(event) => setForm({ ...form, partySize: event.target.value })}
              disabled={isPending}
              aria-invalid={Boolean(errors.partySize)}
            />
            {errors.partySize ? (
              <p className="text-destructive text-xs">{errors.partySize}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dialog-source">Source</Label>
            <select
              id="dialog-source"
              className={RESERVATION_SELECT_CLASSNAME}
              value={form.source}
              onChange={(event) =>
                setForm({ ...form, source: event.target.value as ReservationFormState["source"] })
              }
              disabled={isPending}
            >
              {RESERVATION_SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="dialog-notes">Notes</Label>
            <Input
              id="dialog-notes"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Close
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === "create" ? "Create reservation" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { buildReservationPayload };
