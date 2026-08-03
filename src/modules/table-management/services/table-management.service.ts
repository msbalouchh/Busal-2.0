import { tableManagementRepository } from "@/modules/table-management/repository/table-management-repository";
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

export class TableManagementService {
  listFloors(context?: TablePlatformContext): FloorRecord[] {
    const floors = tableManagementRepository.listFloors();
    if (!context) return floors;

    return floors.filter(
      (record) =>
        record.floor.tenantId === context.tenantId &&
        record.floor.businessId === context.businessId,
    );
  }

  getFloorById(floorId: string): FloorRecord | undefined {
    return tableManagementRepository.findFloorById(floorId);
  }

  getTableById(tableId: string): TableRecord | undefined {
    return tableManagementRepository.findTableById(tableId);
  }

  searchTables(query: TableSearchQuery, context?: TablePlatformContext): TableRecord[] {
    return tableManagementRepository.searchTables({
      ...query,
      tenantId: query.tenantId ?? context?.tenantId,
      businessId: query.businessId ?? context?.businessId,
      branchId: query.branchId ?? context?.branchId,
    });
  }

  createTable(input: CreateTableInput): TableRecord {
    return tableManagementRepository.createTable(input);
  }

  updateTable(input: UpdateTableInput): TableRecord | undefined {
    return tableManagementRepository.updateTable(input);
  }

  mergeTables(input: MergeTablesInput): TableRecord | undefined {
    return tableManagementRepository.mergeTables(input);
  }

  splitTable(input: SplitTableInput): TableRecord[] | undefined {
    return tableManagementRepository.splitTable(input);
  }

  assignTable(input: AssignTableInput): TableRecord | undefined {
    return tableManagementRepository.assignTable(input);
  }

  transferTable(input: TransferTableInput): TableRecord | undefined {
    return tableManagementRepository.transferTable(input);
  }

  getAvailableTables(partySize: number, floorId?: string): TableRecord[] {
    return tableManagementRepository.getAvailableTables(partySize, floorId);
  }
}

export const tableManagementService = new TableManagementService();
