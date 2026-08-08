"use server";

import { revalidatePath } from "next/cache";

import { TABLE_PERMISSIONS } from "@/modules/table-management/constants/permissions";
import { TABLE_MANAGEMENT_ROUTES } from "@/modules/table-management/constants/routes";
import {
  resolveTableScope,
  toTablePlatformContext,
} from "@/modules/table-management/lib/table-scope";
import { tableManagementService } from "@/modules/table-management/services/table-management.service";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import {
  assignTableSchema,
  bulkUpdateTablesSchema,
  createFloorSchema,
  createTableSchema,
  mergeTablesSchema,
  splitTablesSchema,
  transferTableSchema,
  updateFloorSchema,
  updateTableSchema,
} from "@/modules/table-management/validation/table-schemas";

function revalidateTablePages() {
  Object.values(TABLE_MANAGEMENT_ROUTES).forEach((path) => revalidatePath(path));
  revalidatePath("/dashboard/restaurant/tables");
}

export async function createFloorAction(input: unknown) {
  return protectedAction(TABLE_PERMISSIONS.TABLE_CREATE, async ({ platform }) => {
    const body = createFloorSchema.parse(input);
    const context = toTablePlatformContext(resolveTableScope(platform));
    const floor = await tableManagementService.createFloor(context, body);
    revalidateTablePages();
    return { success: true as const, floor };
  });
}

export async function updateFloorAction(input: unknown) {
  return protectedAction(TABLE_PERMISSIONS.TABLE_UPDATE, async ({ platform }) => {
    const body = updateFloorSchema.parse(input);
    const context = toTablePlatformContext(resolveTableScope(platform));
    const floor = await tableManagementService.updateFloor(context, body);
    revalidateTablePages();
    return { success: true as const, floor };
  });
}

export async function createTableAction(input: unknown) {
  return protectedAction(TABLE_PERMISSIONS.TABLE_CREATE, async ({ platform }) => {
    const body = createTableSchema.parse(input);
    const context = toTablePlatformContext(resolveTableScope(platform));
    const record = await tableManagementService.createTable(context, body);
    revalidateTablePages();
    return { success: true as const, record };
  });
}

export async function updateTableAction(input: unknown) {
  return protectedAction(TABLE_PERMISSIONS.TABLE_UPDATE, async ({ platform }) => {
    const body = updateTableSchema.parse(input);
    const context = toTablePlatformContext(resolveTableScope(platform));
    const record = await tableManagementService.updateTable(context, body);
    revalidateTablePages();
    return { success: true as const, record };
  });
}

export async function archiveTableAction(tableId: string) {
  return protectedAction(TABLE_PERMISSIONS.TABLE_DELETE, async ({ platform }) => {
    const context = toTablePlatformContext(resolveTableScope(platform));
    const record = await tableManagementService.archiveTable(context, tableId);
    revalidateTablePages();
    return { success: true as const, record };
  });
}

export async function restoreTableAction(tableId: string) {
  return protectedAction(TABLE_PERMISSIONS.TABLE_UPDATE, async ({ platform }) => {
    const context = toTablePlatformContext(resolveTableScope(platform));
    const record = await tableManagementService.restoreTable(context, tableId);
    revalidateTablePages();
    return { success: true as const, record };
  });
}

export async function bulkUpdateTablesAction(input: unknown) {
  return protectedAction(TABLE_PERMISSIONS.TABLE_UPDATE, async ({ platform }) => {
    const body = bulkUpdateTablesSchema.parse(input);
    const context = toTablePlatformContext(resolveTableScope(platform));
    const updatedCount = await tableManagementService.bulkUpdateStatus(
      context,
      body.tableIds,
      body.status,
    );
    revalidateTablePages();
    return { success: true as const, updatedCount };
  });
}

export async function mergeTablesAction(input: unknown) {
  return protectedAction(TABLE_PERMISSIONS.TABLE_MANAGE, async ({ platform }) => {
    const parsed = mergeTablesSchema.parse(input);
    const context = toTablePlatformContext(resolveTableScope(platform));
    const record = await tableManagementService.mergeTables(context, {
      floorId: parsed.floorId,
      sourceTableIds: [parsed.targetTableId, ...parsed.sourceTableIds],
      mergedLabel: parsed.mergedLabel ?? "Merged Table",
      actorId: platform.user.id,
    });
    revalidateTablePages();
    return { success: true as const, record };
  });
}

export async function splitTablesAction(input: unknown) {
  return protectedAction(TABLE_PERMISSIONS.TABLE_MANAGE, async ({ platform }) => {
    const parsed = splitTablesSchema.parse(input);
    const context = toTablePlatformContext(resolveTableScope(platform));
    const records = await tableManagementService.splitTable(context, {
      floorId: parsed.floorId,
      sourceTableId: parsed.targetTableId,
      newLabels: parsed.sourceTableIds.map((id) => `Split ${id.slice(0, 6)}`),
      actorId: platform.user.id,
    });
    revalidateTablePages();
    return { success: true as const, records };
  });
}

export async function assignTableAction(input: unknown) {
  return protectedAction(TABLE_PERMISSIONS.TABLE_MANAGE, async ({ platform }) => {
    const body = assignTableSchema.parse(input);
    const context = toTablePlatformContext(resolveTableScope(platform));
    const record = await tableManagementService.assignTable(context, {
      ...body,
      actorId: body.staffId ?? platform.user.id,
    });
    revalidateTablePages();
    return { success: true as const, record };
  });
}

export async function transferTableAction(input: unknown) {
  return protectedAction(TABLE_PERMISSIONS.TABLE_MANAGE, async ({ platform }) => {
    const body = transferTableSchema.parse(input);
    const context = toTablePlatformContext(resolveTableScope(platform));
    const record = await tableManagementService.transferTable(context, body);
    revalidateTablePages();
    return { success: true as const, record };
  });
}
