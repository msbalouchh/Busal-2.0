"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateTablePositionsAction } from "@/modules/floor-table-management/actions/floor-table-management-actions";
import type { TableManagementRecord } from "@/modules/floor-table-management/types/floor-table-management-types";

interface FloorPlanCanvasProps {
  branchId: string;
  floorId: string;
  tables: TableManagementRecord[];
  canUpdate?: boolean;
}

function getShapeClass(shape: TableManagementRecord["shape"]): string {
  switch (shape) {
    case "ROUND":
    case "OVAL":
      return "rounded-full";
    case "RECTANGLE":
      return "rounded-md";
    case "CUSTOM":
      return "rounded-lg";
    case "SQUARE":
    default:
      return "rounded-sm";
  }
}

export function FloorPlanCanvas({
  branchId,
  floorId,
  tables,
  canUpdate = false,
}: FloorPlanCanvasProps) {
  const [items, setItems] = useState(tables);
  const [isPending, startTransition] = useTransition();
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(tables);
  }, [tables]);

  const handlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    table: TableManagementRecord,
  ) => {
    if (!canUpdate) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    dragRef.current = {
      id: table.id,
      offsetX: event.clientX - rect.left - table.positionX,
      offsetY: event.clientY - rect.top - table.positionY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !canUpdate) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const positionX = Math.max(0, event.clientX - rect.left - dragRef.current.offsetX);
    const positionY = Math.max(0, event.clientY - rect.top - dragRef.current.offsetY);

    setItems((current) =>
      current.map((table) =>
        table.id === dragRef.current?.id ? { ...table, positionX, positionY } : table,
      ),
    );
  };

  const handlePointerUp = () => {
    if (!dragRef.current || !canUpdate) return;

    const dragged = items.find((table) => table.id === dragRef.current?.id);
    dragRef.current = null;

    if (!dragged) return;

    startTransition(async () => {
      try {
        await updateTablePositionsAction(branchId, floorId, [
          {
            tableId: dragged.id,
            positionX: dragged.positionX,
            positionY: dragged.positionY,
            rotation: dragged.rotation,
          },
        ]);
        toast.success("Table position saved");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save position");
      }
    });
  };

  return (
    <section className="space-y-3 rounded-xl border p-4">
      <div>
        <h3 className="text-lg font-semibold">Floor plan</h3>
        <p className="text-muted-foreground text-sm">
          {canUpdate
            ? "Drag tables to reposition them on the floor layout."
            : "Visual layout of tables on this floor."}
        </p>
      </div>

      <div
        ref={canvasRef}
        className="bg-muted/30 relative min-h-[480px] overflow-hidden rounded-lg border"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {items.length === 0 ? (
          <p className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm">
            No tables on this floor yet.
          </p>
        ) : (
          items.map((table) => (
            <button
              key={table.id}
              type="button"
              className={`border-primary/40 bg-background absolute flex flex-col items-center justify-center border-2 shadow-sm ${getShapeClass(table.shape)} ${canUpdate ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
              style={{
                left: table.positionX,
                top: table.positionY,
                width: table.width,
                height: table.height,
                transform: `rotate(${table.rotation}deg)`,
              }}
              onPointerDown={(event) => handlePointerDown(event, table)}
              disabled={isPending}
            >
              <span className="text-xs font-semibold">{table.tableNumber}</span>
              <span className="text-muted-foreground text-[10px]">{table.capacity} seats</span>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
