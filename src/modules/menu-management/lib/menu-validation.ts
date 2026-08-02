import type { MenuStatus } from "@prisma/client";

import type { MenuManagementInput } from "@/modules/menu-management/types/menu-management-types";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function normalizeMenuName(name: string): string {
  return name.trim();
}

export function parseDaysAvailable(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [1, 2, 3, 4, 5, 6, 7];
  }

  const days = value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isInteger(entry) && entry >= 1 && entry <= 7);

  return days.length > 0 ? [...new Set(days)].sort((a, b) => a - b) : [1, 2, 3, 4, 5, 6, 7];
}

export function validateTimeWindow(
  availableFrom?: string | null,
  availableUntil?: string | null,
): void {
  if (availableFrom?.trim() && !TIME_PATTERN.test(availableFrom.trim())) {
    throw new Error("Available from must use HH:MM format");
  }

  if (availableUntil?.trim() && !TIME_PATTERN.test(availableUntil.trim())) {
    throw new Error("Available until must use HH:MM format");
  }

  if (
    availableFrom?.trim() &&
    availableUntil?.trim() &&
    availableFrom.trim() >= availableUntil.trim()
  ) {
    throw new Error("Available until must be after available from");
  }
}

export function validateMenuInput(input: MenuManagementInput): void {
  if (!normalizeMenuName(input.name)) {
    throw new Error("Menu name is required");
  }

  if (input.name.trim().length > 120) {
    throw new Error("Menu name must be 120 characters or fewer");
  }

  if (input.description && input.description.length > 2000) {
    throw new Error("Description must be 2000 characters or fewer");
  }

  if (
    input.displayOrder != null &&
    (!Number.isInteger(input.displayOrder) || input.displayOrder < 0)
  ) {
    throw new Error("Display order must be a non-negative integer");
  }

  validateTimeWindow(input.availableFrom, input.availableUntil);

  const days = parseDaysAvailable(input.daysAvailable);
  if (days.length === 0) {
    throw new Error("Select at least one day when the menu is available");
  }
}

export function validateMenuStatusTransition(
  currentStatus: MenuStatus,
  nextStatus: MenuStatus,
): void {
  if (currentStatus === nextStatus) {
    return;
  }

  if (currentStatus === "ARCHIVED" && nextStatus !== "INACTIVE" && nextStatus !== "DRAFT") {
    throw new Error("Archived menus can only be restored to draft or inactive");
  }
}

export function buildDuplicateMenuName(name: string): string {
  const base = name.trim();
  const suffix = " (Copy)";
  const maxLength = 120;

  if (base.length + suffix.length <= maxLength) {
    return `${base}${suffix}`;
  }

  return `${base.slice(0, maxLength - suffix.length)}${suffix}`;
}
