"use client";

import type { ReservationStatus } from "@prisma/client";
import { Plus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  cancelReservationAction,
  createReservationAction,
  updateReservationAction,
  updateReservationStatusAction,
} from "@/modules/reservations/actions/reservation-actions";
import { ReservationDetails } from "@/modules/reservations/components/reservation-details";
import {
  buildReservationPayload,
  ReservationFormDialog,
} from "@/modules/reservations/components/reservation-form-dialog";
import {
  ReservationFilters,
  ReservationList,
} from "@/modules/reservations/components/reservation-list";
import {
  type ReservationSortValue,
  type ReservationSourceValue,
  type ReservationStatusValue,
} from "@/modules/reservations/constants/routes";
import {
  createEmptyReservationForm,
  reservationToFormState,
  type ReservationFormState,
} from "@/modules/reservations/lib/reservation-form";
import {
  formatStatusLabel,
  getReservationDateKey,
  type ClientReservation,
} from "@/modules/reservations/lib/reservation-utils";

interface ReservationsManagerProps {
  reservations: ClientReservation[];
}

export function ReservationsManager({ reservations }: ReservationsManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogForm, setDialogForm] = useState<ReservationFormState>(createEmptyReservationForm());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState<ReservationStatusValue | "">("");
  const [filterSource, setFilterSource] = useState<ReservationSourceValue | "">("");
  const [sortBy, setSortBy] = useState<ReservationSortValue>("date");

  const selectedReservation = reservations.find((item) => item.id === selectedId) ?? null;

  const hasFilters = Boolean(searchQuery.trim() || filterDate || filterStatus || filterSource);

  const filteredReservations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = reservations.filter((item) => {
      if (filterDate && getReservationDateKey(item.reservationDate) !== filterDate) {
        return false;
      }

      if (filterStatus && item.status !== filterStatus) {
        return false;
      }

      if (filterSource && item.source !== filterSource) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        item.reservationNumber.toLowerCase().includes(query) ||
        item.customerName.toLowerCase().includes(query) ||
        item.customerPhone.toLowerCase().includes(query)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "time") {
        return a.startTime.localeCompare(b.startTime);
      }

      const dateCompare = getReservationDateKey(a.reservationDate).localeCompare(
        getReservationDateKey(b.reservationDate),
      );

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return a.startTime.localeCompare(b.startTime);
    });
  }, [reservations, searchQuery, filterDate, filterStatus, filterSource, sortBy]);

  const openCreateDialog = () => {
    setDialogMode("create");
    setEditingId(null);
    setDialogForm(createEmptyReservationForm());
    setDialogOpen(true);
  };

  const openEditDialog = (reservation: ClientReservation) => {
    setSelectedId(reservation.id);
    setDialogMode("edit");
    setEditingId(reservation.id);
    setDialogForm(reservationToFormState(reservation));
    setDialogOpen(true);
  };

  const handleFormSubmit = (form: ReservationFormState) => {
    const payload = buildReservationPayload(form);

    startTransition(async () => {
      try {
        if (editingId) {
          await updateReservationAction(editingId, payload);
          toast.success("Reservation updated");
        } else {
          await createReservationAction(payload);
          toast.success("Reservation created");
        }
        setDialogOpen(false);
        setEditingId(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save reservation");
      }
    });
  };

  const handleCancel = (reservationId: string) => {
    startTransition(async () => {
      try {
        await cancelReservationAction(reservationId);
        toast.success("Reservation cancelled");
        if (selectedId === reservationId) {
          setSelectedId(null);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to cancel reservation");
      }
    });
  };

  const handleStatusUpdate = (reservationId: string, status: ReservationStatus) => {
    startTransition(async () => {
      try {
        await updateReservationStatusAction(reservationId, status);
        toast.success(`Status updated to ${formatStatusLabel(status)}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update status");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button type="button" onClick={openCreateDialog} disabled={isPending}>
          <Plus className="h-4 w-4" />
          New reservation
        </Button>
      </div>

      <ReservationFilters
        searchQuery={searchQuery}
        filterDate={filterDate}
        filterStatus={filterStatus}
        filterSource={filterSource}
        sortBy={sortBy}
        isPending={isPending}
        onSearchChange={setSearchQuery}
        onFilterDateChange={setFilterDate}
        onFilterStatusChange={setFilterStatus}
        onFilterSourceChange={setFilterSource}
        onSortChange={setSortBy}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ReservationList
            reservations={filteredReservations}
            selectedId={selectedId}
            isPending={isPending}
            hasFilters={hasFilters}
            onSelect={setSelectedId}
            onCreate={openCreateDialog}
          />
        </div>

        <ReservationDetails
          reservation={selectedReservation}
          isPending={isPending}
          onEdit={openEditDialog}
          onCancel={handleCancel}
          onStatusUpdate={handleStatusUpdate}
        />
      </div>

      <ReservationFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialForm={dialogForm}
        isPending={isPending}
        onOpenChange={setDialogOpen}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
