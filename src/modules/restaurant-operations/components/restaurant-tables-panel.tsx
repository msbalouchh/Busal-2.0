"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  mergeRestaurantTablesAction,
  splitRestaurantTablesAction,
} from "@/modules/restaurant-operations/actions/restaurant-operations-actions";
import { TablesManager } from "@/modules/tables/components/tables-manager";
import type { ClientTable } from "@/modules/tables/lib/table-utils";
import type {
  RestaurantOperationsPermissions,
  SerializedTableFloorItem,
} from "@/modules/restaurant-operations/types/restaurant-operations-types";

interface RestaurantTablesPanelProps {
  tables: ClientTable[];
  floor: SerializedTableFloorItem[];
  permissions: RestaurantOperationsPermissions;
}

export function RestaurantTablesPanel({ tables, floor, permissions }: RestaurantTablesPanelProps) {
  const [view, setView] = useState<"floor" | "list">("floor");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetTableId, setTargetTableId] = useState("");
  const [isPending, startTransition] = useTransition();

  const inactiveTables = useMemo(() => floor.filter((table) => !table.isActive), [floor]);

  const toggleSelection = (tableId: string) => {
    setSelectedIds((current) =>
      current.includes(tableId) ? current.filter((id) => id !== tableId) : [...current, tableId],
    );
  };

  const handleMerge = () => {
    if (!targetTableId || selectedIds.length === 0) {
      toast.error("Select a target table and at least one source table");
      return;
    }

    startTransition(async () => {
      try {
        await mergeRestaurantTablesAction({
          targetTableId,
          sourceTableIds: selectedIds.filter((id) => id !== targetTableId),
        });
        toast.success("Tables merged");
        setSelectedIds([]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to merge tables");
      }
    });
  };

  const handleSplit = () => {
    if (!targetTableId || selectedIds.length === 0) {
      toast.error("Select tables to split");
      return;
    }

    const restoredCapacities = Object.fromEntries(
      selectedIds.map((tableId) => {
        const table = inactiveTables.find((entry) => entry.id === tableId);
        return [tableId, table?.capacity ?? 2];
      }),
    );

    startTransition(async () => {
      try {
        await splitRestaurantTablesAction({
          targetTableId,
          sourceTableIds: selectedIds,
          restoredCapacities,
        });
        toast.success("Tables split");
        setSelectedIds([]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to split tables");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={view === "floor" ? "default" : "outline"}
          onClick={() => setView("floor")}
        >
          Floor view
        </Button>
        <Button
          type="button"
          variant={view === "list" ? "default" : "outline"}
          onClick={() => setView("list")}
        >
          Table list
        </Button>
      </div>

      {view === "floor" ? (
        <div className="space-y-4">
          <div className="bg-muted/20 relative min-h-[420px] overflow-auto rounded-lg border p-4">
            {floor.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active tables configured.</p>
            ) : (
              floor.map((table) => {
                const left = table.positionX ?? 24 + (floor.indexOf(table) % 4) * 160;
                const top = table.positionY ?? 24 + Math.floor(floor.indexOf(table) / 4) * 120;

                return (
                  <button
                    key={table.id}
                    type="button"
                    aria-pressed={selectedIds.includes(table.id)}
                    onClick={() => permissions.canManageTables && toggleSelection(table.id)}
                    className={`absolute min-w-28 rounded-lg border px-3 py-2 text-left text-sm shadow-sm transition ${
                      selectedIds.includes(table.id)
                        ? "border-primary bg-primary/10"
                        : "bg-background"
                    }`}
                    style={{ left, top }}
                  >
                    <div className="font-medium">{table.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {table.status.replaceAll("_", " ")} · {table.capacity} seats
                    </div>
                    <div className="text-muted-foreground text-xs">
                      QR {table.qrCodeCount} · RSV {table.activeReservationCount}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {permissions.canManageTables ? (
            <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="merge-target">Target table</Label>
                <select
                  id="merge-target"
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                  value={targetTableId}
                  onChange={(event) => setTargetTableId(event.target.value)}
                >
                  <option value="">Select target</option>
                  {floor.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button type="button" disabled={isPending} onClick={handleMerge}>
                  Merge tables
                </Button>
                <Button type="button" variant="outline" disabled={isPending} onClick={handleSplit}>
                  Split tables
                </Button>
              </div>
              <div className="text-muted-foreground text-sm">
                Selected: {selectedIds.length || 0} table(s)
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <TablesManager tables={tables} />
      )}
    </div>
  );
}
