"use server";

import type { TableStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { TABLE_ROUTES } from "@/modules/tables/constants/routes";
import { requireAuthenticatedUser } from "@/modules/onboarding/lib/onboarding-guard";
import {
  createTable,
  deleteTable,
  updateTable,
  updateTableStatus,
  type CreateTableInput,
  type UpdateTableInput,
} from "@/services/table.service";

function revalidateTablePages() {
  revalidatePath(TABLE_ROUTES.overview);
}

export async function createTableAction(
  input: CreateTableInput,
  status: TableStatus = "AVAILABLE",
) {
  const user = await requireAuthenticatedUser();
  const table = await createTable(user.id, input);

  if (status !== table.status) {
    await updateTableStatus(user.id, table.id, status);
  }

  revalidateTablePages();
  return { success: true as const };
}

export async function updateTableAction(
  tableId: string,
  input: UpdateTableInput,
  status?: TableStatus,
) {
  const user = await requireAuthenticatedUser();
  await updateTable(user.id, tableId, input);

  if (status !== undefined) {
    await updateTableStatus(user.id, tableId, status);
  }

  revalidateTablePages();
  return { success: true as const };
}

export async function deleteTableAction(tableId: string) {
  const user = await requireAuthenticatedUser();
  await deleteTable(user.id, tableId);
  revalidateTablePages();
  return { success: true as const };
}

export async function updateTableStatusAction(tableId: string, status: TableStatus) {
  const user = await requireAuthenticatedUser();
  await updateTableStatus(user.id, tableId, status);
  revalidateTablePages();
  return { success: true as const };
}
