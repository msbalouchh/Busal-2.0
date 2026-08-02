import type { ModifierGroupStatus, SelectionType } from "@prisma/client";

import type {
  ModifierManagementInput,
  ModifierOptionInput,
} from "@/modules/modifier-management/types/modifier-management-types";

const NAME_PATTERN = /^[\p{L}\p{N}\s\-_'&.()+/]{2,120}$/u;

export function normalizeModifierName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function validateModifierGroupInput(input: ModifierManagementInput): void {
  const name = normalizeModifierName(input.name);

  if (!name) {
    throw new Error("Modifier group name is required");
  }

  if (!NAME_PATTERN.test(name)) {
    throw new Error("Modifier group name must be 2-120 characters");
  }

  const minimumSelection = input.minimumSelection ?? 0;
  const maximumSelection = input.maximumSelection ?? 1;

  if (!Number.isInteger(minimumSelection) || minimumSelection < 0) {
    throw new Error("Minimum selection must be a non-negative integer");
  }

  if (!Number.isInteger(maximumSelection) || maximumSelection < 1) {
    throw new Error("Maximum selection must be at least 1");
  }

  if (minimumSelection > maximumSelection) {
    throw new Error("Minimum selection cannot exceed maximum selection");
  }

  if (input.selectionType === "SINGLE" && maximumSelection > 1) {
    throw new Error("Single selection groups must have a maximum selection of 1");
  }

  if (
    input.displayOrder != null &&
    (!Number.isInteger(input.displayOrder) || input.displayOrder < 0)
  ) {
    throw new Error("Display order must be a non-negative integer");
  }
}

export function validateModifierOptionInput(input: ModifierOptionInput): void {
  const name = normalizeModifierName(input.name);

  if (!name) {
    throw new Error("Modifier option name is required");
  }

  if (!NAME_PATTERN.test(name)) {
    throw new Error("Modifier option name must be 2-120 characters");
  }

  const priceAdjustment = input.priceAdjustment ?? 0;

  if (Number.isNaN(priceAdjustment)) {
    throw new Error("Price adjustment must be a valid number");
  }

  if (input.costAdjustment != null && Number.isNaN(input.costAdjustment)) {
    throw new Error("Cost adjustment must be a valid number");
  }

  if (
    input.displayOrder != null &&
    (!Number.isInteger(input.displayOrder) || input.displayOrder < 0)
  ) {
    throw new Error("Display order must be a non-negative integer");
  }
}

export function validateModifierStatusTransition(
  currentStatus: ModifierGroupStatus,
  nextStatus: ModifierGroupStatus,
): void {
  if (currentStatus === nextStatus) {
    return;
  }

  if (currentStatus === "ARCHIVED" && nextStatus !== "INACTIVE" && nextStatus !== "ACTIVE") {
    throw new Error("Archived modifier groups can only be restored to active or inactive");
  }
}

export function buildDuplicateModifierGroupName(name: string): string {
  const base = name.trim();
  const copyMatch = base.match(/^(.*) \(Copy(?: (\d+))?\)$/);

  if (copyMatch) {
    const root = copyMatch[1];
    const attempt = copyMatch[2] ? Number(copyMatch[2]) + 1 : 2;
    return `${root} (Copy ${attempt})`;
  }

  return `${base} (Copy)`;
}

export function resolveSelectionDefaults(selectionType: SelectionType): {
  minimumSelection: number;
  maximumSelection: number;
} {
  if (selectionType === "SINGLE") {
    return { minimumSelection: 0, maximumSelection: 1 };
  }

  return { minimumSelection: 0, maximumSelection: 3 };
}
