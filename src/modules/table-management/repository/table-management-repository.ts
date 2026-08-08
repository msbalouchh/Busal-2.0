import "server-only";

import type { Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { runInteractiveTransaction } from "@/lib/prisma-transaction";
import { TABLE_STATUSES } from "@/modules/table-management/constants/table-status";
import {
  mapDomainStatusToPrisma,
  mapFloorToRecord,
  mapTableToRecord,
  type RestaurantFloorWithTables,
  type RestaurantTableWithRelations,
} from "@/modules/table-management/lib/table-mappers";
import type { TableTenantScope } from "@/modules/table-management/lib/table-scope";
import type {
  AssignTableInput,
  CreateTableInput,
  FloorRecord,
  MergeTablesInput,
  SplitTableInput,
  TableRecord,
  TableSearchQuery,
  TransferTableInput,
  UpdateTableInput,
} from "@/modules/table-management/types/table-management";
import type {
  CreateFloorInput,
  TableSearchInput,
  UpdateFloorInput,
} from "@/modules/table-management/validation/table-schemas";

const DEFAULT_PAGE_SIZE = 25;

const tableInclude = {
  floor: true,
  tableQrCodes: { where: { status: "ACTIVE" }, take: 1 },
  reservations: {
    where: { status: { in: ["PENDING", "CONFIRMED", "SEATED"] } },
    orderBy: { reservationDate: "asc" },
    take: 3,
  },
  mergedSources: { where: { status: { not: "ARCHIVED" } } },
} satisfies Prisma.RestaurantTableInclude;

const floorInclude = {
  tables: {
    where: { status: { not: "ARCHIVED" } },
    include: tableInclude,
    orderBy: { tableNumber: "asc" },
  },
} satisfies Prisma.RestaurantFloorInclude;

export interface TableSearchResult {
  records: TableRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function scopeWhere(scope: TableTenantScope): Prisma.RestaurantTableWhereInput {
  return {
    businessId: scope.businessId,
    branchId: scope.branchId,
  };
}

function buildNotes(input: CreateTableInput): string | null {
  const tags: string[] = [];
  if (input.isVip) tags.push("vip");
  if (input.isOutdoor) tags.push("outdoor");
  if (input.isPrivateRoom) tags.push("private");
  return tags.length > 0 ? tags.join(",") : null;
}

function resolveZoneId(floorId: string, zoneId?: string): string {
  return zoneId ?? `${floorId}-main-dining`;
}

function resolveTableOrderBy(
  sortBy: TableSearchInput["sortBy"] = "number",
  sortDirection: "asc" | "desc" = "asc",
): Prisma.RestaurantTableOrderByWithRelationInput[] {
  switch (sortBy) {
    case "capacity":
      return [{ capacity: sortDirection }];
    case "status":
      return [{ status: sortDirection }, { tableNumber: "asc" }];
    case "createdAt":
      return [{ createdAt: sortDirection }];
    case "label":
      return [{ tableName: sortDirection }, { tableNumber: "asc" }];
    case "number":
    default:
      return [{ tableNumber: sortDirection }];
  }
}

/** Prisma-backed table management repository with tenant scoping. */
export class TableManagementRepository {
  async listFloors(scope: TableTenantScope): Promise<FloorRecord[]> {
    const floors = await prisma.restaurantFloor.findMany({
      where: {
        businessId: scope.businessId,
        branchId: scope.branchId,
        status: { not: "ARCHIVED" },
      },
      include: floorInclude,
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });

    return floors.map((floor) => mapFloorToRecord(floor as RestaurantFloorWithTables, scope));
  }

  async findFloorById(scope: TableTenantScope, floorId: string): Promise<FloorRecord | null> {
    const floor = await prisma.restaurantFloor.findFirst({
      where: {
        id: floorId,
        businessId: scope.businessId,
        branchId: scope.branchId,
      },
      include: floorInclude,
    });

    return floor ? mapFloorToRecord(floor as RestaurantFloorWithTables, scope) : null;
  }

  async createFloor(scope: TableTenantScope, input: CreateFloorInput): Promise<FloorRecord> {
    const floor = await prisma.restaurantFloor.create({
      data: {
        businessId: scope.businessId,
        branchId: scope.branchId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        displayOrder: input.displayOrder ?? 0,
        status: "ACTIVE",
      },
      include: floorInclude,
    });

    return mapFloorToRecord(floor as RestaurantFloorWithTables, scope);
  }

  async updateFloor(scope: TableTenantScope, input: UpdateFloorInput): Promise<FloorRecord | null> {
    const existing = await prisma.restaurantFloor.findFirst({
      where: {
        id: input.floorId,
        businessId: scope.businessId,
        branchId: scope.branchId,
      },
    });

    if (!existing) {
      return null;
    }

    const floor = await prisma.restaurantFloor.update({
      where: { id: input.floorId },
      data: {
        name: input.name?.trim(),
        description: input.description?.trim(),
        displayOrder: input.displayOrder,
        status:
          input.isActive === undefined ? undefined : input.isActive ? "ACTIVE" : "INACTIVE",
      },
      include: floorInclude,
    });

    return mapFloorToRecord(floor as RestaurantFloorWithTables, scope);
  }

  async archiveFloor(scope: TableTenantScope, floorId: string): Promise<boolean> {
    const result = await prisma.restaurantFloor.updateMany({
      where: {
        id: floorId,
        businessId: scope.businessId,
        branchId: scope.branchId,
      },
      data: { status: "ARCHIVED" },
    });

    return result.count > 0;
  }

  async findTableById(scope: TableTenantScope, tableId: string): Promise<TableRecord | null> {
    const table = await prisma.restaurantTable.findFirst({
      where: { id: tableId, ...scopeWhere(scope) },
      include: tableInclude,
    });

    if (!table) {
      return null;
    }

    return mapTableToRecord(
      table as RestaurantTableWithRelations,
      scope,
      resolveZoneId(table.floorId),
    );
  }

  async searchTables(
    scope: TableTenantScope,
    query: TableSearchQuery & TableSearchInput = {},
  ): Promise<TableSearchResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? query.limit ?? DEFAULT_PAGE_SIZE;
    const where: Prisma.RestaurantTableWhereInput = {
      ...scopeWhere(scope),
      ...(query.includeArchived ? {} : { status: { not: "ARCHIVED" } }),
    };

    if (query.floorId) {
      where.floorId = query.floorId;
    }

    if (query.status) {
      where.status = mapDomainStatusToPrisma(query.status);
    }

    if (query.minCapacity) {
      where.capacity = { gte: query.minCapacity };
    }

    if (query.query?.trim()) {
      const search = query.query.trim();
      where.OR = [
        { tableNumber: { contains: search, mode: "insensitive" } },
        { tableName: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const [tables, total] = await Promise.all([
      prisma.restaurantTable.findMany({
        where,
        include: tableInclude,
        orderBy: resolveTableOrderBy(query.sortBy, query.sortDirection),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.restaurantTable.count({ where }),
    ]);

    const zoneId = query.floorId ? resolveZoneId(query.floorId, query.zoneId) : "default-zone";

    return {
      records: tables.map((table) =>
        mapTableToRecord(table as RestaurantTableWithRelations, scope, zoneId),
      ),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async createTable(scope: TableTenantScope, input: CreateTableInput): Promise<TableRecord> {
    const floor = await prisma.restaurantFloor.findFirst({
      where: {
        id: input.floorId,
        businessId: scope.businessId,
        branchId: scope.branchId,
      },
    });

    if (!floor) {
      throw new Error(`Floor not found: ${input.floorId}`);
    }

    const tableNumber = `T${Date.now().toString().slice(-8)}`;
    const zoneId = resolveZoneId(input.floorId, input.zoneId);

    const table = await prisma.restaurantTable.create({
      data: {
        businessId: scope.businessId,
        branchId: scope.branchId,
        floorId: input.floorId,
        tableNumber,
        tableName: input.label.trim(),
        capacity: input.seatCapacity,
        minimumCapacity: input.minCapacity ?? 1,
        positionX: input.position?.x ?? 100,
        positionY: input.position?.y ?? 100,
        width: input.size?.width ?? 80,
        height: input.size?.height ?? 80,
        rotation: input.position?.rotation ?? 0,
        notes: buildNotes(input),
        status: "AVAILABLE",
      },
      include: tableInclude,
    });

    await this.ensureQrCode(scope, table.id);

    const refreshed = await prisma.restaurantTable.findFirstOrThrow({
      where: { id: table.id },
      include: tableInclude,
    });

    return mapTableToRecord(refreshed as RestaurantTableWithRelations, scope, zoneId);
  }

  async updateTable(scope: TableTenantScope, input: UpdateTableInput): Promise<TableRecord | null> {
    const existing = await prisma.restaurantTable.findFirst({
      where: { id: input.tableId, ...scopeWhere(scope) },
    });

    if (!existing) {
      return null;
    }

    const table = await prisma.restaurantTable.update({
      where: { id: input.tableId },
      data: {
        tableName: input.label?.trim(),
        capacity: input.seatCapacity,
        positionX: input.position?.x,
        positionY: input.position?.y,
        rotation: input.position?.rotation,
        status: input.status ? mapDomainStatusToPrisma(input.status) : undefined,
      },
      include: tableInclude,
    });

    return mapTableToRecord(
      table as RestaurantTableWithRelations,
      scope,
      resolveZoneId(table.floorId, input.zoneId),
    );
  }

  async archiveTable(scope: TableTenantScope, tableId: string): Promise<TableRecord | null> {
    const existing = await prisma.restaurantTable.findFirst({
      where: { id: tableId, ...scopeWhere(scope) },
    });

    if (!existing) {
      return null;
    }

    const table = await prisma.restaurantTable.update({
      where: { id: tableId },
      data: { status: "ARCHIVED", mergedIntoTableId: null },
      include: tableInclude,
    });

    return mapTableToRecord(
      table as RestaurantTableWithRelations,
      scope,
      resolveZoneId(table.floorId),
    );
  }

  async restoreTable(scope: TableTenantScope, tableId: string): Promise<TableRecord | null> {
    const table = await prisma.restaurantTable.update({
      where: { id: tableId },
      data: { status: "AVAILABLE", mergedIntoTableId: null },
      include: tableInclude,
    });

    if (table.businessId !== scope.businessId || table.branchId !== scope.branchId) {
      return null;
    }

    return mapTableToRecord(
      table as RestaurantTableWithRelations,
      scope,
      resolveZoneId(table.floorId),
    );
  }

  async deleteTable(scope: TableTenantScope, tableId: string): Promise<boolean> {
    const result = await prisma.restaurantTable.deleteMany({
      where: { id: tableId, ...scopeWhere(scope) },
    });

    return result.count > 0;
  }

  async bulkUpdateStatus(
    scope: TableTenantScope,
    tableIds: string[],
    status: UpdateTableInput["status"],
  ): Promise<number> {
    if (!status) {
      return 0;
    }

    const result = await prisma.restaurantTable.updateMany({
      where: { id: { in: tableIds }, ...scopeWhere(scope) },
      data: { status: mapDomainStatusToPrisma(status) },
    });

    return result.count;
  }

  async mergeTables(scope: TableTenantScope, input: MergeTablesInput): Promise<TableRecord | null> {
    const [targetTableId, ...sourceTableIds] = input.sourceTableIds;

    if (!targetTableId || sourceTableIds.length === 0) {
      throw new Error("Select at least two tables to merge");
    }

    return runInteractiveTransaction(async (tx) => {
      const target = await tx.restaurantTable.findFirst({
        where: { id: targetTableId, ...scopeWhere(scope) },
        include: tableInclude,
      });

      if (!target) {
        return null;
      }

      const sources = await tx.restaurantTable.findMany({
        where: {
          id: { in: sourceTableIds },
          ...scopeWhere(scope),
          floorId: input.floorId,
        },
      });

      if (sources.length !== sourceTableIds.length) {
        throw new Error("One or more source tables not found");
      }

      const mergedCapacity =
        target.capacity + sources.reduce((total, table) => total + table.capacity, 0);

      await tx.restaurantTable.update({
        where: { id: target.id },
        data: {
          capacity: mergedCapacity,
          status: "OCCUPIED",
          tableName: input.mergedLabel ?? target.tableName,
        },
      });

      for (const source of sources) {
        await tx.restaurantTable.update({
          where: { id: source.id },
          data: { status: "OUT_OF_SERVICE", mergedIntoTableId: target.id },
        });
      }

      const updated = await tx.restaurantTable.findFirstOrThrow({
        where: { id: target.id },
        include: tableInclude,
      });

      return mapTableToRecord(
        updated as RestaurantTableWithRelations,
        scope,
        resolveZoneId(updated.floorId),
      );
    });
  }

  async splitTable(scope: TableTenantScope, input: SplitTableInput): Promise<TableRecord[]> {
    const updatedSources = await runInteractiveTransaction(async (tx) => {
      const target = await tx.restaurantTable.findFirst({
        where: { id: input.sourceTableId, ...scopeWhere(scope), floorId: input.floorId },
      });

      if (!target) {
        return [];
      }

      const mergedChildren = await tx.restaurantTable.findMany({
        where: { mergedIntoTableId: target.id, ...scopeWhere(scope) },
      });

      let restoredCapacity = 0;
      for (const source of mergedChildren) {
        restoredCapacity += source.capacity;
        await tx.restaurantTable.update({
          where: { id: source.id },
          data: { status: "AVAILABLE", mergedIntoTableId: null },
        });
      }

      await tx.restaurantTable.update({
        where: { id: target.id },
        data: {
          capacity: Math.max(target.minimumCapacity, target.capacity - restoredCapacity),
          status: "AVAILABLE",
        },
      });

      return tx.restaurantTable.findMany({
        where: {
          id: { in: [target.id, ...mergedChildren.map((entry) => entry.id)] },
          ...scopeWhere(scope),
        },
        include: tableInclude,
      });
    });

    return updatedSources.map((table) =>
      mapTableToRecord(table as RestaurantTableWithRelations, scope, resolveZoneId(table.floorId)),
    );
  }

  async assignTable(scope: TableTenantScope, input: AssignTableInput): Promise<TableRecord | null> {
    const table = await prisma.restaurantTable.update({
      where: { id: input.tableId },
      data: { status: "OCCUPIED" },
      include: tableInclude,
    });

    if (table.businessId !== scope.businessId || table.branchId !== scope.branchId) {
      return null;
    }

    if (input.reservationId) {
      await prisma.reservation.updateMany({
        where: {
          id: input.reservationId,
          businessId: scope.businessId,
          branchId: scope.branchId,
        },
        data: {
          restaurantTableId: input.tableId,
          status: "SEATED",
          checkInTime: new Date(),
          ...(input.actorId ? { assignedStaffId: input.actorId } : {}),
        },
      });
    }

    return mapTableToRecord(
      table as RestaurantTableWithRelations,
      scope,
      resolveZoneId(table.floorId),
    );
  }

  async transferTable(
    scope: TableTenantScope,
    input: TransferTableInput,
  ): Promise<TableRecord | null> {
    return runInteractiveTransaction(async (tx) => {
      const from = await tx.restaurantTable.findFirst({
        where: { id: input.fromTableId, ...scopeWhere(scope) },
      });
      const to = await tx.restaurantTable.findFirst({
        where: { id: input.toTableId, ...scopeWhere(scope) },
      });

      if (!from || !to) {
        return null;
      }

      await tx.restaurantTable.update({
        where: { id: from.id },
        data: { status: "DIRTY" },
      });

      await tx.restaurantTable.update({
        where: { id: to.id },
        data: { status: "OCCUPIED" },
      });

      if (input.orderId) {
        await tx.restaurantOrder.updateMany({
          where: { id: input.orderId, businessId: scope.businessId },
          data: { restaurantTableId: to.id },
        });
      }

      const updated = await tx.restaurantTable.findFirstOrThrow({
        where: { id: to.id },
        include: tableInclude,
      });

      return mapTableToRecord(
        updated as RestaurantTableWithRelations,
        scope,
        resolveZoneId(updated.floorId),
      );
    });
  }

  async getAvailableTables(
    scope: TableTenantScope,
    partySize: number,
    floorId?: string,
  ): Promise<TableRecord[]> {
    const result = await this.searchTables(scope, {
      floorId,
      minCapacity: partySize,
      status: TABLE_STATUSES.AVAILABLE,
      pageSize: 100,
    });

    return result.records.filter((record) => record.availability.isAvailable);
  }

  private async ensureQrCode(scope: TableTenantScope, tableId: string): Promise<void> {
    const existing = await prisma.tableQRCode.findUnique({ where: { tableId } });

    if (existing) {
      return;
    }

    const token = randomBytes(16).toString("hex");
    await prisma.tableQRCode.create({
      data: {
        businessId: scope.businessId,
        branchId: scope.branchId,
        tableId,
        token,
        qrCodeUrl: `https://order.getbusal.com/t/${token}`,
        status: "ACTIVE",
      },
    });
  }
}

export const tableManagementRepository = new TableManagementRepository();
