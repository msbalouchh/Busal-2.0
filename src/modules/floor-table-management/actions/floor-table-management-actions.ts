"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { FLOOR_TABLE_MANAGEMENT_ROUTES } from "@/modules/floor-table-management/constants/routes";
import { requireFloorTableActionContext } from "@/modules/floor-table-management/lib/get-floor-table-management-context";
import {
  validateFloorInput,
  validateTableInput,
} from "@/modules/floor-table-management/lib/floor-table-validation";
import type {
  FloorManagementInput,
  MergeTablesInput,
  MoveTableInput,
  SplitTablesInput,
  TableManagementInput,
  TablePositionInput,
} from "@/modules/floor-table-management/types/floor-table-management-types";
import {
  archiveManagedFloor,
  createManagedFloor,
  deleteManagedFloor,
  duplicateManagedFloor,
  restoreManagedFloor,
  updateManagedFloor,
} from "@/services/restaurant-floor.service";
import {
  archiveManagedTable,
  createManagedTable,
  deleteManagedTable,
  duplicateManagedTable,
  mergeManagedTables,
  moveManagedTable,
  restoreManagedTable,
  splitManagedTables,
  updateManagedTable,
  updateTablePositions,
} from "@/services/restaurant-table.service";

function revalidateFloorTablePages(branchId: string, floorId?: string, tableId?: string) {
  revalidatePath(FLOOR_TABLE_MANAGEMENT_ROUTES.floorListForBranch(branchId));

  if (floorId) {
    revalidatePath(FLOOR_TABLE_MANAGEMENT_ROUTES.floorDetails(floorId, branchId));
    revalidatePath(FLOOR_TABLE_MANAGEMENT_ROUTES.floorEdit(floorId, branchId));

    if (tableId) {
      revalidatePath(FLOOR_TABLE_MANAGEMENT_ROUTES.tableDetails(floorId, tableId, branchId));
      revalidatePath(FLOOR_TABLE_MANAGEMENT_ROUTES.tableEdit(floorId, tableId, branchId));
    }
  }
}

export async function createFloorManagementAction(branchId: string, input: FloorManagementInput) {
  const context = await requireFloorTableActionContext(branchId, PERMISSION_CODES.FLOOR_CREATE);
  validateFloorInput(input);
  const floor = await createManagedFloor(context.user.id, { ...input, branchId });
  revalidateFloorTablePages(branchId, floor.id);
  return { success: true as const, floorId: floor.id };
}

export async function updateFloorManagementAction(
  branchId: string,
  floorId: string,
  input: FloorManagementInput,
) {
  const context = await requireFloorTableActionContext(branchId, PERMISSION_CODES.FLOOR_UPDATE);
  validateFloorInput(input);
  await updateManagedFloor(context.user.id, floorId, { ...input, branchId });
  revalidateFloorTablePages(branchId, floorId);
  return { success: true as const };
}

export async function duplicateFloorManagementAction(branchId: string, floorId: string) {
  const context = await requireFloorTableActionContext(branchId, PERMISSION_CODES.FLOOR_CREATE);
  const floor = await duplicateManagedFloor(context.user.id, branchId, floorId);
  revalidateFloorTablePages(branchId, floor.id);
  return { success: true as const, floorId: floor.id };
}

export async function archiveFloorManagementAction(branchId: string, floorId: string) {
  const context = await requireFloorTableActionContext(branchId, PERMISSION_CODES.FLOOR_DELETE);
  await archiveManagedFloor(context.user.id, branchId, floorId);
  revalidateFloorTablePages(branchId, floorId);
  return { success: true as const };
}

export async function restoreFloorManagementAction(branchId: string, floorId: string) {
  const context = await requireFloorTableActionContext(branchId, PERMISSION_CODES.FLOOR_UPDATE);
  await restoreManagedFloor(context.user.id, branchId, floorId);
  revalidateFloorTablePages(branchId, floorId);
  return { success: true as const };
}

export async function deleteFloorManagementAction(branchId: string, floorId: string) {
  const context = await requireFloorTableActionContext(branchId, PERMISSION_CODES.FLOOR_DELETE);
  await deleteManagedFloor(context.user.id, branchId, floorId);
  revalidateFloorTablePages(branchId, floorId);
  return { success: true as const };
}

export async function createTableManagementAction(branchId: string, input: TableManagementInput) {
  const context = await requireFloorTableActionContext(branchId, PERMISSION_CODES.TABLE_CREATE);
  validateTableInput(input);
  const table = await createManagedTable(context.user.id, { ...input, branchId });
  revalidateFloorTablePages(branchId, input.floorId, table.id);
  return { success: true as const, tableId: table.id };
}

export async function updateTableManagementAction(
  branchId: string,
  tableId: string,
  input: TableManagementInput,
) {
  const context = await requireFloorTableActionContext(branchId, PERMISSION_CODES.TABLE_UPDATE);
  validateTableInput(input);
  await updateManagedTable(context.user.id, tableId, { ...input, branchId });
  revalidateFloorTablePages(branchId, input.floorId, tableId);
  return { success: true as const };
}

export async function duplicateTableManagementAction(
  branchId: string,
  floorId: string,
  tableId: string,
) {
  const context = await requireFloorTableActionContext(branchId, PERMISSION_CODES.TABLE_CREATE);
  const table = await duplicateManagedTable(context.user.id, branchId, tableId);
  revalidateFloorTablePages(branchId, floorId, table.id);
  return { success: true as const, tableId: table.id };
}

export async function archiveTableManagementAction(
  branchId: string,
  floorId: string,
  tableId: string,
) {
  const context = await requireFloorTableActionContext(branchId, PERMISSION_CODES.TABLE_DELETE);
  await archiveManagedTable(context.user.id, branchId, tableId);
  revalidateFloorTablePages(branchId, floorId, tableId);
  return { success: true as const };
}

export async function restoreTableManagementAction(
  branchId: string,
  floorId: string,
  tableId: string,
) {
  const context = await requireFloorTableActionContext(branchId, PERMISSION_CODES.TABLE_UPDATE);
  await restoreManagedTable(context.user.id, branchId, tableId);
  revalidateFloorTablePages(branchId, floorId, tableId);
  return { success: true as const };
}

export async function deleteTableManagementAction(
  branchId: string,
  floorId: string,
  tableId: string,
) {
  const context = await requireFloorTableActionContext(branchId, PERMISSION_CODES.TABLE_DELETE);
  await deleteManagedTable(context.user.id, branchId, tableId);
  revalidateFloorTablePages(branchId, floorId, tableId);
  return { success: true as const };
}

export async function updateTablePositionsAction(
  branchId: string,
  floorId: string,
  positions: TablePositionInput[],
) {
  const context = await requireFloorTableActionContext(branchId, PERMISSION_CODES.TABLE_UPDATE);
  await updateTablePositions(context.user.id, branchId, positions);
  revalidateFloorTablePages(branchId, floorId);
  return { success: true as const };
}

export async function moveTableManagementAction(branchId: string, input: MoveTableInput) {
  const context = await requireFloorTableActionContext(branchId, PERMISSION_CODES.TABLE_UPDATE);
  const table = await moveManagedTable(context.user.id, input);
  revalidateFloorTablePages(branchId, input.targetFloorId, table.id);
  return { success: true as const, table };
}

export async function mergeTablesManagementAction(branchId: string, input: MergeTablesInput) {
  const context = await requireFloorTableActionContext(branchId, PERMISSION_CODES.TABLE_UPDATE);
  const table = await mergeManagedTables(context.user.id, input);
  revalidateFloorTablePages(branchId);
  return { success: true as const, table };
}

export async function splitTablesManagementAction(branchId: string, input: SplitTablesInput) {
  const context = await requireFloorTableActionContext(branchId, PERMISSION_CODES.TABLE_UPDATE);
  const table = await splitManagedTables(context.user.id, input);
  revalidateFloorTablePages(branchId);
  return { success: true as const, table };
}
