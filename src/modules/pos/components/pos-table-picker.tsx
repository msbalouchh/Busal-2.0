"use client";

import { cn } from "@/lib/utils";
import type { PosTableView } from "@/modules/pos/types/pos";

interface PosTablePickerProps {
  tables: PosTableView[];
  selectedTableId: string | null;
  disabled?: boolean;
  onSelect: (tableId: string | null) => void;
}

function tableStatusLabel(status: PosTableView["status"]): string {
  switch (status) {
    case "AVAILABLE":
      return "Available";
    case "OCCUPIED":
      return "Occupied";
    case "RESERVED":
      return "Reserved";
    case "CLEANING":
      return "Cleaning";
    default:
      return "Unavailable";
  }
}

export function PosTablePicker({
  tables,
  selectedTableId,
  disabled = false,
  onSelect,
}: PosTablePickerProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Table</p>
        <button
          type="button"
          className="text-primary text-xs font-medium disabled:opacity-50"
          disabled={disabled}
          onClick={() => onSelect(null)}
        >
          Walk-in
        </button>
      </div>

      <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto">
        {tables.map((table) => {
          const isSelected = selectedTableId === table.id;
          const isAvailable = table.status === "AVAILABLE";

          return (
            <button
              key={table.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(table.id)}
              className={cn(
                "touch-manipulation rounded-lg border px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60",
                isSelected ? "border-primary bg-primary/5" : "hover:border-primary/40",
                !isAvailable && !isSelected && "opacity-70",
              )}
            >
              <p className="font-medium">{table.name}</p>
              <p className="text-muted-foreground text-xs">
                {tableStatusLabel(table.status)} · {table.capacity} seats
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
