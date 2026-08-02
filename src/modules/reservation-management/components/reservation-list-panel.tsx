"use client";

import { CalendarDays, Clock3, List, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BranchSelector } from "@/modules/branch-management/components/branch-selector";
import { ReservationCalendarView } from "@/modules/reservation-management/components/reservation-calendar-view";
import { ReservationDashboardStatsCards } from "@/modules/reservation-management/components/reservation-dashboard-stats";
import { ReservationEmptyState } from "@/modules/reservation-management/components/reservation-empty-state";
import { ReservationStatusBadge } from "@/modules/reservation-management/components/reservation-status-badge";
import { ReservationTimelineView } from "@/modules/reservation-management/components/reservation-timeline-view";
import {
  RESERVATION_MANAGEMENT_ROUTES,
  RESERVATION_SORT_OPTIONS,
  RESERVATION_SOURCE_FILTER_OPTIONS,
  RESERVATION_STATUS_FILTER_OPTIONS,
  RESERVATION_VIEW_OPTIONS,
  type ReservationViewMode,
} from "@/modules/reservation-management/constants/routes";
import type { ReservationManagementContext } from "@/modules/reservation-management/lib/get-reservation-management-context";
import type {
  CalendarReservationEntry,
  ReservationDashboardStats,
  ReservationListResult,
} from "@/modules/reservation-management/types/reservation-management-types";

interface ReservationListPanelProps {
  context: ReservationManagementContext;
  list: ReservationListResult;
  stats: ReservationDashboardStats;
  calendarEntries: CalendarReservationEntry[];
  initialSearch?: string;
  initialStatus?: string;
  initialSource?: string;
  initialSortBy?: string;
  initialSortDirection?: string;
  initialView?: ReservationViewMode;
  initialDate?: string;
}

export function ReservationListPanel({
  context,
  list,
  stats,
  calendarEntries,
  initialSearch = "",
  initialStatus = "ALL",
  initialSource = "ALL",
  initialSortBy = "reservationDate",
  initialSortDirection = "asc",
  initialView = "list",
  initialDate = new Date().toISOString().slice(0, 10),
}: ReservationListPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [source, setSource] = useState(initialSource);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortDirection] = useState(initialSortDirection);
  const [view, setView] = useState<ReservationViewMode>(initialView);
  const [date, setDate] = useState(initialDate);
  const branchId = context.selectedBranchId;

  const applyFilters = (page = 1) => {
    if (!branchId) return;

    const params = new URLSearchParams({ branchId, view });
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);
    if (source !== "ALL") params.set("source", source);
    if (sortBy !== "reservationDate") params.set("sortBy", sortBy);
    if (sortDirection !== "asc") params.set("sortDirection", sortDirection);
    if (date) params.set("date", date);
    if (page > 1) params.set("page", String(page));

    startTransition(() => {
      router.push(`${RESERVATION_MANAGEMENT_ROUTES.list()}?${params.toString()}`);
    });
  };

  const handleBranchChange = (nextBranchId: string) => {
    startTransition(() => {
      router.push(RESERVATION_MANAGEMENT_ROUTES.listForBranch(nextBranchId));
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium">Branch</p>
          <BranchSelector
            branches={context.branches}
            value={branchId ?? undefined}
            onValueChange={handleBranchChange}
            placeholder="Select branch"
          />
        </div>
        {branchId && context.permissionsFlags.canCreate ? (
          <Button asChild>
            <Link href={RESERVATION_MANAGEMENT_ROUTES.create(branchId)}>
              <Plus className="mr-2 h-4 w-4" />
              Create reservation
            </Link>
          </Button>
        ) : null}
      </div>

      {branchId ? (
        <>
          <ReservationDashboardStatsCards stats={stats} />

          <div className="space-y-6">
            <div className="grid gap-3 lg:grid-cols-6">
              <div className="relative lg:col-span-2">
                <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search reservations"
                  className="pl-9"
                />
              </div>
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              <select
                className="border-input bg-background flex h-10 rounded-md border px-3 py-2 text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {RESERVATION_STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className="border-input bg-background flex h-10 rounded-md border px-3 py-2 text-sm"
                value={source}
                onChange={(event) => setSource(event.target.value)}
              >
                {RESERVATION_SOURCE_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className="border-input bg-background flex h-10 rounded-md border px-3 py-2 text-sm"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                {RESERVATION_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => applyFilters()} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Apply filters
              </Button>
              {RESERVATION_VIEW_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={view === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setView(option.value);
                    const params = new URLSearchParams({ branchId, view: option.value });
                    if (date) params.set("date", date);
                    startTransition(() => {
                      router.push(`${RESERVATION_MANAGEMENT_ROUTES.list()}?${params.toString()}`);
                    });
                  }}
                >
                  {option.value === "list" ? (
                    <List className="mr-2 h-4 w-4" />
                  ) : option.value === "calendar" ? (
                    <CalendarDays className="mr-2 h-4 w-4" />
                  ) : (
                    <Clock3 className="mr-2 h-4 w-4" />
                  )}
                  {option.label}
                </Button>
              ))}
            </div>

            {view === "list" ? (
              list.items.length === 0 ? (
                <ReservationEmptyState
                  branchId={branchId}
                  canCreate={context.permissionsFlags.canCreate}
                />
              ) : (
                <div className="overflow-hidden rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr className="text-left">
                        <th className="p-3 font-medium">Guest</th>
                        <th className="p-3 font-medium">Date & time</th>
                        <th className="p-3 font-medium">Party</th>
                        <th className="p-3 font-medium">Table</th>
                        <th className="p-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.items.map((reservation) => (
                        <tr key={reservation.id} className="border-t">
                          <td className="p-3">
                            <Link
                              href={RESERVATION_MANAGEMENT_ROUTES.details(reservation.id, branchId)}
                              className="font-medium hover:underline"
                            >
                              {reservation.guestName}
                            </Link>
                            <p className="text-muted-foreground text-xs">
                              {reservation.reservationNumber}
                            </p>
                          </td>
                          <td className="p-3">
                            {reservation.reservationDate}
                            <p className="text-muted-foreground text-xs">
                              {reservation.startTime} – {reservation.endTime}
                            </p>
                          </td>
                          <td className="p-3">{reservation.partySize}</td>
                          <td className="p-3">
                            {reservation.restaurantTable
                              ? `${reservation.restaurantTable.floorName} · ${
                                  reservation.restaurantTable.tableName ??
                                  reservation.restaurantTable.tableNumber
                                }`
                              : "Unassigned"}
                          </td>
                          <td className="p-3">
                            <ReservationStatusBadge status={reservation.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : null}

            {view === "calendar" ? (
              <ReservationCalendarView
                branchId={branchId}
                entries={calendarEntries}
                referenceDate={date}
              />
            ) : null}

            {view === "timeline" ? (
              <ReservationTimelineView
                branchId={branchId}
                entries={calendarEntries}
                referenceDate={date}
              />
            ) : null}
          </div>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">Select a branch to manage reservations.</p>
      )}
    </div>
  );
}
