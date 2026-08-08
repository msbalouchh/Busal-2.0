import "server-only";

import { DOMAIN_EVENT_TYPES } from "@/modules/platform-orchestration/constants/domain-events";
import {
  moduleScopeFromPlatform,
  publishModuleDomainEvent,
} from "@/modules/platform-orchestration/lib/publish-module-event";
import {
  tableManagementRepository,
  type TableSearchResult,
} from "@/modules/table-management/repository/table-management-repository";
import type { TableTenantScope } from "@/modules/table-management/lib/table-scope";
import type {
  AssignTableInput,
  CreateTableInput,
  FloorRecord,
  MergeTablesInput,
  SplitTableInput,
  TablePlatformContext,
  TableRecord,
  TableSearchQuery,
  TransferTableInput,
  UpdateTableInput,
} from "@/modules/table-management/types/table-management";
import type {
  CreateFloorInput,
  UpdateFloorInput,
} from "@/modules/table-management/validation/table-schemas";

function toScope(context: TablePlatformContext): TableTenantScope {
  return {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  };
}

export class TableManagementService {
  async listFloors(context: TablePlatformContext): Promise<FloorRecord[]> {
    return tableManagementRepository.listFloors(toScope(context));
  }

  async getFloorById(context: TablePlatformContext, floorId: string): Promise<FloorRecord | null> {
    return tableManagementRepository.findFloorById(toScope(context), floorId);
  }

  async createFloor(context: TablePlatformContext, input: CreateFloorInput): Promise<FloorRecord> {
    return tableManagementRepository.createFloor(toScope(context), input);
  }

  async updateFloor(
    context: TablePlatformContext,
    input: UpdateFloorInput,
  ): Promise<FloorRecord | null> {
    return tableManagementRepository.updateFloor(toScope(context), input);
  }

  async archiveFloor(context: TablePlatformContext, floorId: string): Promise<boolean> {
    return tableManagementRepository.archiveFloor(toScope(context), floorId);
  }

  async getTableById(context: TablePlatformContext, tableId: string): Promise<TableRecord | null> {
    return tableManagementRepository.findTableById(toScope(context), tableId);
  }

  async searchTables(
    query: TableSearchQuery,
    context: TablePlatformContext,
  ): Promise<TableSearchResult> {
    return tableManagementRepository.searchTables(toScope(context), {
      ...query,
      tenantId: query.tenantId ?? context.tenantId,
      businessId: query.businessId ?? context.businessId,
      branchId: query.branchId ?? context.branchId,
    });
  }

  async createTable(context: TablePlatformContext, input: CreateTableInput): Promise<TableRecord> {
    return tableManagementRepository.createTable(toScope(context), input);
  }

  async updateTable(
    context: TablePlatformContext,
    input: UpdateTableInput,
  ): Promise<TableRecord | null> {
    return tableManagementRepository.updateTable(toScope(context), input);
  }

  async archiveTable(context: TablePlatformContext, tableId: string): Promise<TableRecord | null> {
    return tableManagementRepository.archiveTable(toScope(context), tableId);
  }

  async restoreTable(context: TablePlatformContext, tableId: string): Promise<TableRecord | null> {
    return tableManagementRepository.restoreTable(toScope(context), tableId);
  }

  async deleteTable(context: TablePlatformContext, tableId: string): Promise<boolean> {
    return tableManagementRepository.deleteTable(toScope(context), tableId);
  }

  async bulkUpdateStatus(
    context: TablePlatformContext,
    tableIds: string[],
    status: UpdateTableInput["status"],
  ): Promise<number> {
    return tableManagementRepository.bulkUpdateStatus(toScope(context), tableIds, status);
  }

  async mergeTables(
    context: TablePlatformContext,
    input: MergeTablesInput,
  ): Promise<TableRecord | null> {
    return tableManagementRepository.mergeTables(toScope(context), input);
  }

  async splitTable(
    context: TablePlatformContext,
    input: SplitTableInput,
  ): Promise<TableRecord[]> {
    return tableManagementRepository.splitTable(toScope(context), input);
  }

  async assignTable(
    context: TablePlatformContext,
    input: AssignTableInput,
  ): Promise<TableRecord | null> {
    const record = await tableManagementRepository.assignTable(toScope(context), input);
    if (record) {
      await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
        eventType: DOMAIN_EVENT_TYPES.TABLE_ASSIGNED,
        aggregateId: input.tableId,
        payload: {
          tableId: input.tableId,
          reservationId: input.reservationId ?? null,
        },
        idempotencyKey: `table.assigned:${input.tableId}:${input.reservationId ?? "walk-in"}`,
      });
    }
    return record;
  }

  async transferTable(
    context: TablePlatformContext,
    input: TransferTableInput,
  ): Promise<TableRecord | null> {
    return tableManagementRepository.transferTable(toScope(context), input);
  }

  async getAvailableTables(
    context: TablePlatformContext,
    partySize: number,
    floorId?: string,
  ): Promise<TableRecord[]> {
    return tableManagementRepository.getAvailableTables(toScope(context), partySize, floorId);
  }
}

export const tableManagementService = new TableManagementService();
