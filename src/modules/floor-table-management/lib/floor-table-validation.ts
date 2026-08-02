import type { FloorStatus } from "@prisma/client";

import type {
  FloorManagementInput,
  TableManagementInput,
} from "@/modules/floor-table-management/types/floor-table-management-types";

const NAME_PATTERN = /^[\p{L}\p{N}\s\-_'&.()]{2,120}$/u;
const TABLE_NUMBER_PATTERN = /^[\p{L}\p{N}\-#]{1,32}$/u;

export function normalizeFloorName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function normalizeTableNumber(tableNumber: string): string {
  return tableNumber.trim().toUpperCase();
}

export function validateFloorInput(input: FloorManagementInput): void {
  const name = normalizeFloorName(input.name);

  if (!name) {
    throw new Error("Floor name is required");
  }

  if (!NAME_PATTERN.test(name)) {
    throw new Error("Floor name must be 2-120 characters");
  }

  if (!input.branchId?.trim()) {
    throw new Error("Branch is required");
  }

  if (
    input.displayOrder != null &&
    (!Number.isInteger(input.displayOrder) || input.displayOrder < 0)
  ) {
    throw new Error("Display order must be a non-negative integer");
  }
}

export function validateTableInput(input: TableManagementInput): void {
  const tableNumber = normalizeTableNumber(input.tableNumber);

  if (!tableNumber) {
    throw new Error("Table number is required");
  }

  if (!TABLE_NUMBER_PATTERN.test(tableNumber)) {
    throw new Error("Table number must be 1-32 characters");
  }

  if (!input.branchId?.trim()) {
    throw new Error("Branch is required");
  }

  if (!input.floorId?.trim()) {
    throw new Error("Floor is required");
  }

  if (!Number.isInteger(input.capacity) || input.capacity < 1) {
    throw new Error("Capacity must be at least 1");
  }

  const minimumCapacity = input.minimumCapacity ?? 1;

  if (!Number.isInteger(minimumCapacity) || minimumCapacity < 1) {
    throw new Error("Minimum capacity must be at least 1");
  }

  if (minimumCapacity > input.capacity) {
    throw new Error("Minimum capacity cannot exceed capacity");
  }

  if (input.positionX != null && Number.isNaN(input.positionX)) {
    throw new Error("Position X must be a valid number");
  }

  if (input.positionY != null && Number.isNaN(input.positionY)) {
    throw new Error("Position Y must be a valid number");
  }

  if (input.width != null && (Number.isNaN(input.width) || input.width <= 0)) {
    throw new Error("Width must be greater than zero");
  }

  if (input.height != null && (Number.isNaN(input.height) || input.height <= 0)) {
    throw new Error("Height must be greater than zero");
  }
}

export function validateFloorStatusTransition(
  currentStatus: FloorStatus,
  nextStatus: FloorStatus,
): void {
  if (currentStatus === nextStatus) {
    return;
  }

  if (currentStatus === "ARCHIVED" && nextStatus !== "INACTIVE" && nextStatus !== "ACTIVE") {
    throw new Error("Archived floors can only be restored to active or inactive");
  }
}

export function buildDuplicateFloorName(name: string): string {
  const base = name.trim();
  const copyMatch = base.match(/^(.*) \(Copy(?: (\d+))?\)$/);

  if (copyMatch) {
    const root = copyMatch[1];
    const attempt = copyMatch[2] ? Number(copyMatch[2]) + 1 : 2;
    return `${root} (Copy ${attempt})`;
  }

  return `${base} (Copy)`;
}

export function buildDuplicateTableNumber(tableNumber: string): string {
  const base = normalizeTableNumber(tableNumber);
  const copyMatch = base.match(/^(.*)-COPY(?:-(\d+))?$/);

  if (copyMatch) {
    const root = copyMatch[1];
    const attempt = copyMatch[2] ? Number(copyMatch[2]) + 1 : 2;
    return `${root}-COPY-${attempt}`;
  }

  return `${base}-COPY`;
}
