"use client";

import { Loader2 } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RESERVATION_SORT_OPTIONS,
  RESERVATION_SOURCE_OPTIONS,
  RESERVATION_STATUS_OPTIONS,
  type ReservationSortValue,
  type ReservationSourceValue,
  type ReservationStatusValue,
} from "@/modules/reservations/constants/routes";
import { RESERVATION_SELECT_CLASSNAME } from "@/modules/reservations/lib/reservation-form";
import {
  formatReservationDate,
  formatSourceLabel,
  formatStatusLabel,
  type ClientReservation,
} from "@/modules/reservations/lib/reservation-utils";

interface ReservationFiltersProps {
  searchQuery: string;
  filterDate: string;
  filterStatus: ReservationStatusValue | "";
  filterSource: ReservationSourceValue | "";
  sortBy: ReservationSortValue;
  isPending: boolean;
  onSearchChange: (value: string) => void;
  onFilterDateChange: (value: string) => void;
  onFilterStatusChange: (value: ReservationStatusValue | "") => void;
  onFilterSourceChange: (value: ReservationSourceValue | "") => void;
  onSortChange: (value: ReservationSortValue) => void;
}

export function ReservationFilters({
  searchQuery,
  filterDate,
  filterStatus,
  filterSource,
  sortBy,
  isPending,
  onSearchChange,
  onFilterDateChange,
  onFilterStatusChange,
  onFilterSourceChange,
  onSortChange,
}: ReservationFiltersProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <div className="space-y-2 lg:col-span-2">
        <Label htmlFor="reservation-search">Search</Label>
        <Input
          id="reservation-search"
          placeholder="Reservation number, customer name, or phone"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-date">Date</Label>
        <Input
          id="filter-date"
          type="date"
          value={filterDate}
          onChange={(event) => onFilterDateChange(event.target.value)}
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-sort">Sort by</Label>
        <select
          id="filter-sort"
          className={RESERVATION_SELECT_CLASSNAME}
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value as ReservationSortValue)}
          disabled={isPending}
        >
          {RESERVATION_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-status">Status</Label>
        <select
          id="filter-status"
          className={RESERVATION_SELECT_CLASSNAME}
          value={filterStatus}
          onChange={(event) =>
            onFilterStatusChange(event.target.value as ReservationStatusValue | "")
          }
          disabled={isPending}
        >
          <option value="">All statuses</option>
          {RESERVATION_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-source">Source</Label>
        <select
          id="filter-source"
          className={RESERVATION_SELECT_CLASSNAME}
          value={filterSource}
          onChange={(event) =>
            onFilterSourceChange(event.target.value as ReservationSourceValue | "")
          }
          disabled={isPending}
        >
          <option value="">All sources</option>
          {RESERVATION_SOURCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

interface ReservationListProps {
  reservations: ClientReservation[];
  selectedId: string | null;
  isPending: boolean;
  hasFilters: boolean;
  onSelect: (reservationId: string) => void;
  onCreate: () => void;
}

export function ReservationList({
  reservations,
  selectedId,
  isPending,
  hasFilters,
  onSelect,
  onCreate,
}: ReservationListProps) {
  if (isPending && reservations.length === 0) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <EmptyState
        title={hasFilters ? "No matching reservations" : "No reservations yet"}
        description={
          hasFilters
            ? "Try adjusting your search or filters to find reservations."
            : "Create your first reservation to start managing bookings."
        }
        action={
          hasFilters
            ? undefined
            : {
                label: "Create reservation",
                onClick: onCreate,
              }
        }
      />
    );
  }

  return (
    <div className="relative space-y-3">
      {isPending ? (
        <div className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center rounded-lg">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      ) : null}
      {reservations.map((reservation) => (
        <button
          key={reservation.id}
          type="button"
          onClick={() => onSelect(reservation.id)}
          disabled={isPending}
          className={`w-full rounded-lg border p-4 text-left transition-colors ${
            selectedId === reservation.id ? "border-primary bg-muted/40" : "hover:bg-muted/20"
          }`}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{reservation.customerName}</p>
              <p className="text-muted-foreground">{reservation.reservationNumber}</p>
              <p className="text-muted-foreground">
                {formatReservationDate(reservation.reservationDate)} · {reservation.startTime} –{" "}
                {reservation.endTime} · Party of {reservation.partySize}
              </p>
            </div>
            <div className="text-sm">
              <p className="font-medium">{formatStatusLabel(reservation.status)}</p>
              <p className="text-muted-foreground">{formatSourceLabel(reservation.source)}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
