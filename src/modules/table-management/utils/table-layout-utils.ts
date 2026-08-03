import type { DiningTable, FloorZone } from "@/modules/table-management/types/table-management";

export interface LayoutPoint {
  x: number;
  y: number;
}

export interface LayoutBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Snap layout coordinate to grid for drag-and-drop floor editor. */
export function snapToGrid(value: number, gridSize = 20): number {
  return Math.round(value / gridSize) * gridSize;
}

/** Clamp table position within floor canvas bounds. */
export function clampTablePosition(
  position: LayoutPoint,
  tableSize: { width: number; height: number },
  canvas: { width: number; height: number },
): LayoutPoint {
  return {
    x: Math.max(0, Math.min(position.x, canvas.width - tableSize.width)),
    y: Math.max(0, Math.min(position.y, canvas.height - tableSize.height)),
  };
}

/** Detect whether a table center lies within a zone bounds. */
export function isTableInZone(table: DiningTable, zone: FloorZone): boolean {
  const centerX = table.position.x + table.size.width / 2;
  const centerY = table.position.y + table.size.height / 2;
  const { bounds } = zone;

  return (
    centerX >= bounds.x &&
    centerX <= bounds.x + bounds.width &&
    centerY >= bounds.y &&
    centerY <= bounds.y + bounds.height
  );
}

/** Serialize table layout for drag-and-drop persistence payloads. */
export function serializeTableLayout(table: DiningTable): Record<string, unknown> {
  return {
    tableId: table.id,
    position: table.position,
    size: table.size,
    zoneId: table.zoneId,
    dragDropReady: table.dragDropReady,
  };
}

/** Calculate bounding box for a set of table positions (merge preview). */
export function calculateTablesBounds(
  tables: Array<Pick<DiningTable, "position" | "size">>,
): LayoutBounds | null {
  if (tables.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const table of tables) {
    minX = Math.min(minX, table.position.x);
    minY = Math.min(minY, table.position.y);
    maxX = Math.max(maxX, table.position.x + table.size.width);
    maxY = Math.max(maxY, table.position.y + table.size.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
