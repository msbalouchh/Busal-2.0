"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TableAvailabilitySlot } from "@/modules/reservation-management/types/reservation-management-types";

interface TableAvailabilityPanelProps {
  slots: TableAvailabilitySlot[];
  selectedTableId?: string | null;
  onSelectTable?: (tableId: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function TableAvailabilityPanel({
  slots,
  selectedTableId,
  onSelectTable,
  onRefresh,
  isRefreshing = false,
}: TableAvailabilityPanelProps) {
  const availableCount = slots.filter((slot) => slot.isAvailable).length;

  return (
    <Card className="h-fit rounded-xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Table availability</CardTitle>
          <p className="text-muted-foreground text-sm">
            {availableCount} of {slots.length} tables available
          </p>
        </div>
        {onRefresh ? (
          <Button variant="outline" size="icon" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2">
        {slots.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No reservable tables match this party size.
          </p>
        ) : (
          slots.map((slot) => (
            <button
              key={slot.restaurantTableId}
              type="button"
              disabled={!slot.isAvailable}
              onClick={() => onSelectTable?.(slot.restaurantTableId)}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                selectedTableId === slot.restaurantTableId
                  ? "border-primary bg-primary/5"
                  : slot.isAvailable
                    ? "hover:bg-muted/60"
                    : "opacity-60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">
                  {slot.floorName} · {slot.tableName ?? slot.tableNumber}
                </p>
                <span
                  className={`text-xs ${slot.isAvailable ? "text-emerald-600" : "text-destructive"}`}
                >
                  {slot.isAvailable ? "Available" : "Unavailable"}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                Capacity {slot.minimumCapacity}–{slot.capacity}
              </p>
              {!slot.isAvailable && slot.conflictReason ? (
                <p className="text-destructive mt-1 text-xs">{slot.conflictReason}</p>
              ) : null}
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}
