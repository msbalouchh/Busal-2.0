import type { TableStatusValue } from "@/modules/tables/constants/routes";
import type { ClientTable } from "@/modules/tables/lib/table-utils";
import type { CreateTableInput, UpdateTableInput } from "@/services/table.service";

export interface TableFormState {
  name: string;
  section: string;
  capacity: string;
  status: TableStatusValue;
  isActive: boolean;
}

export interface TableFormErrors {
  name?: string;
  capacity?: string;
}

export function createEmptyTableForm(): TableFormState {
  return {
    name: "",
    section: "",
    capacity: "2",
    status: "AVAILABLE",
    isActive: true,
  };
}

export function validateTableForm(form: TableFormState): TableFormErrors {
  const errors: TableFormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Table name is required";
  }

  const capacity = Number.parseInt(form.capacity, 10);
  if (!Number.isInteger(capacity) || capacity < 1) {
    errors.capacity = "Capacity must be greater than 0";
  }

  return errors;
}

export function buildCreateTablePayload(form: TableFormState): CreateTableInput {
  return {
    name: form.name.trim(),
    section: form.section.trim() || undefined,
    capacity: Number.parseInt(form.capacity, 10),
    isActive: form.isActive,
  };
}

export function buildUpdateTablePayload(form: TableFormState): UpdateTableInput {
  return {
    name: form.name.trim(),
    section: form.section.trim() || null,
    capacity: Number.parseInt(form.capacity, 10),
    isActive: form.isActive,
  };
}

export function tableToFormState(table: ClientTable): TableFormState {
  return {
    name: table.name,
    section: table.section ?? "",
    capacity: String(table.capacity),
    status: table.status,
    isActive: table.isActive,
  };
}

export const TABLE_SELECT_CLASSNAME =
  "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";
