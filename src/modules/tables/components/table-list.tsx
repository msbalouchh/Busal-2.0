"use client";

import type { TableStatus } from "@prisma/client";
import { Loader2, Pencil, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TABLE_SORT_OPTIONS,
  TABLE_STATUS_OPTIONS,
  type TableSortValue,
  type TableStatusValue,
} from "@/modules/tables/constants/routes";
import { TABLE_SELECT_CLASSNAME } from "@/modules/tables/lib/table-form";
import { formatTableStatusLabel, type ClientTable } from "@/modules/tables/lib/table-utils";

interface TableFiltersProps {
  searchQuery: string;
  filterStatus: TableStatusValue | "";
  filterSection: string;
  filterActive: "" | "active" | "inactive";
  sortBy: TableSortValue;
  sections: string[];
  isPending: boolean;
  onSearchChange: (value: string) => void;
  onFilterStatusChange: (value: TableStatusValue | "") => void;
  onFilterSectionChange: (value: string) => void;
  onFilterActiveChange: (value: "" | "active" | "inactive") => void;
  onSortChange: (value: TableSortValue) => void;
}

export function TableFilters({
  searchQuery,
  filterStatus,
  filterSection,
  filterActive,
  sortBy,
  sections,
  isPending,
  onSearchChange,
  onFilterStatusChange,
  onFilterSectionChange,
  onFilterActiveChange,
  onSortChange,
}: TableFiltersProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="space-y-2 lg:col-span-2">
        <Label htmlFor="table-search">Search</Label>
        <Input
          id="table-search"
          placeholder="Table name"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-table-status">Status</Label>
        <select
          id="filter-table-status"
          className={TABLE_SELECT_CLASSNAME}
          value={filterStatus}
          onChange={(event) => onFilterStatusChange(event.target.value as TableStatusValue | "")}
          disabled={isPending}
        >
          <option value="">All statuses</option>
          {TABLE_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-table-section">Section</Label>
        <select
          id="filter-table-section"
          className={TABLE_SELECT_CLASSNAME}
          value={filterSection}
          onChange={(event) => onFilterSectionChange(event.target.value)}
          disabled={isPending}
        >
          <option value="">All sections</option>
          {sections.map((section) => (
            <option key={section} value={section}>
              {section}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-table-active">Active</Label>
        <select
          id="filter-table-active"
          className={TABLE_SELECT_CLASSNAME}
          value={filterActive}
          onChange={(event) =>
            onFilterActiveChange(event.target.value as "" | "active" | "inactive")
          }
          disabled={isPending}
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-table-sort">Sort by</Label>
        <select
          id="filter-table-sort"
          className={TABLE_SELECT_CLASSNAME}
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value as TableSortValue)}
          disabled={isPending}
        >
          {TABLE_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

interface TableListProps {
  tables: ClientTable[];
  isPending: boolean;
  hasFilters: boolean;
  onEdit: (table: ClientTable) => void;
  onDelete: (tableId: string) => void;
  onStatusChange: (tableId: string, status: TableStatus) => void;
  onCreate: () => void;
}

export function TableList({
  tables,
  isPending,
  hasFilters,
  onEdit,
  onDelete,
  onStatusChange,
  onCreate,
}: TableListProps) {
  if (isPending && tables.length === 0) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <EmptyState
        title={hasFilters ? "No matching tables" : "No tables yet"}
        description={
          hasFilters
            ? "Try adjusting your search or filters to find tables."
            : "Create your first table to start managing seating."
        }
        action={
          hasFilters
            ? undefined
            : {
                label: "Create table",
                onClick: onCreate,
              }
        }
      />
    );
  }

  return (
    <div className="relative overflow-x-auto rounded-lg border">
      {isPending ? (
        <div className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      ) : null}
      <table className="w-full min-w-[960px] text-sm">
        <thead>
          <tr className="bg-muted/40 border-b text-left">
            <th className="px-4 py-3 font-medium">Table Name</th>
            <th className="px-4 py-3 font-medium">Section</th>
            <th className="px-4 py-3 font-medium">Capacity</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Active</th>
            <th className="px-4 py-3 font-medium">Current Reservation</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tables.map((table) => (
            <tr key={table.id} className="border-b last:border-b-0">
              <td className="px-4 py-3 font-medium">{table.name}</td>
              <td className="text-muted-foreground px-4 py-3">{table.section ?? "—"}</td>
              <td className="px-4 py-3">{table.capacity}</td>
              <td className="px-4 py-3">
                <select
                  className={TABLE_SELECT_CLASSNAME}
                  value={table.status}
                  onChange={(event) => onStatusChange(table.id, event.target.value as TableStatus)}
                  disabled={isPending}
                  aria-label={`Change status for ${table.name}`}
                >
                  {TABLE_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">{table.isActive ? "Yes" : "No"}</td>
              <td className="px-4 py-3">
                {table.currentReservation ? (
                  <div className="space-y-0.5">
                    <p>{table.currentReservation.customerName}</p>
                    <p className="text-muted-foreground text-xs">
                      {table.currentReservation.reservationNumber}
                    </p>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(table)}
                    disabled={isPending}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(table.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function formatTableStatus(status: TableStatus): string {
  return formatTableStatusLabel(status);
}
