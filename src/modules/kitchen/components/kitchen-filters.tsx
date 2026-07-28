"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  KITCHEN_PRIORITY_OPTIONS,
  KITCHEN_STATION_OPTIONS,
  KITCHEN_STATUS_FILTER_OPTIONS,
  type KitchenPriorityFilterValue,
  type KitchenStationFilterValue,
  type KitchenStatusFilterValue,
} from "@/modules/kitchen/constants/routes";

const selectClassName =
  "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

interface KitchenFiltersProps {
  searchQuery: string;
  stationFilter: KitchenStationFilterValue;
  priorityFilter: KitchenPriorityFilterValue;
  statusFilter: KitchenStatusFilterValue;
  isPending: boolean;
  onSearchChange: (value: string) => void;
  onStationFilterChange: (value: KitchenStationFilterValue) => void;
  onPriorityFilterChange: (value: KitchenPriorityFilterValue) => void;
  onStatusFilterChange: (value: KitchenStatusFilterValue) => void;
}

export function KitchenFilters({
  searchQuery,
  stationFilter,
  priorityFilter,
  statusFilter,
  isPending,
  onSearchChange,
  onStationFilterChange,
  onPriorityFilterChange,
  onStatusFilterChange,
}: KitchenFiltersProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="space-y-2 lg:col-span-2">
        <Label htmlFor="kitchen-search">Search</Label>
        <Input
          id="kitchen-search"
          placeholder="Order number or table"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="kitchen-station">Station</Label>
        <select
          id="kitchen-station"
          className={selectClassName}
          value={stationFilter}
          onChange={(event) =>
            onStationFilterChange(event.target.value as KitchenStationFilterValue)
          }
          disabled={isPending}
        >
          {KITCHEN_STATION_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="kitchen-priority">Priority</Label>
        <select
          id="kitchen-priority"
          className={selectClassName}
          value={priorityFilter}
          onChange={(event) =>
            onPriorityFilterChange(event.target.value as KitchenPriorityFilterValue)
          }
          disabled={isPending}
        >
          {KITCHEN_PRIORITY_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="kitchen-status">Status</Label>
        <select
          id="kitchen-status"
          className={selectClassName}
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as KitchenStatusFilterValue)}
          disabled={isPending}
        >
          {KITCHEN_STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
