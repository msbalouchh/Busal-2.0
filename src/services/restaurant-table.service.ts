import "server-only";

import type { Prisma, RestaurantTableStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { TABLE_LIST_PAGE_SIZE } from "@/modules/floor-table-management/constants/routes";
import {
  buildDuplicateTableNumber,
  normalizeTableNumber,
  validateTableInput,
} from "@/modules/floor-table-management/lib/floor-table-validation";
import type {
  MergeTablesInput,
  MoveTableInput,
  SplitTablesInput,
  TableListQuery,
  TableListResult,
  TableManagementInput,
  TableManagementRecord,
  TablePositionInput,
  TableSortField,
} from "@/modules/floor-table-management/types/floor-table-management-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

type TableWithFloor = Prisma.RestaurantTableGetPayload<{
  include: { floor: { select: { id: true; name: true } } };
}>;

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

function serializeTable(table: TableWithFloor): TableManagementRecord {
  return {
    id: table.id,
    businessId: table.businessId,
    branchId: table.branchId,
    floorId: table.floorId,
    floorName: table.floor.name,
    tableNumber: table.tableNumber,
    tableName: table.tableName,
    capacity: table.capacity,
    minimumCapacity: table.minimumCapacity,
    shape: table.shape,
    positionX: table.positionX,
    positionY: table.positionY,
    width: table.width,
    height: table.height,
    rotation: table.rotation,
    status: table.status,
    isReservable: table.isReservable,
    isMergeable: table.isMergeable,
    mergedIntoTableId: table.mergedIntoTableId,
    notes: table.notes,
    createdAt: table.createdAt.toISOString(),
    updatedAt: table.updatedAt.toISOString(),
  };
}

const tableInclude = {
  floor: { select: { id: true, name: true } },
} satisfies Prisma.RestaurantTableInclude;

function resolveTableOrderBy(
  sortBy: TableSortField = "tableNumber",
  sortDirection: "asc" | "desc" = "asc",
): Prisma.RestaurantTableOrderByWithRelationInput[] {
  switch (sortBy) {
    case "capacity":
      return [{ capacity: sortDirection }];
    case "createdAt":
      return [{ createdAt: sortDirection }];
    case "status":
      return [{ status: sortDirection }, { tableNumber: "asc" }];
    case "tableNumber":
    default:
      return [{ tableNumber: sortDirection }];
  }
}

function buildTableWhere(
  businessId: string,
  query: TableListQuery,
): Prisma.RestaurantTableWhereInput {
  const where: Prisma.RestaurantTableWhereInput = {
    businessId,
    branchId: query.branchId,
  };

  if (query.floorId) {
    where.floorId = query.floorId;
  }

  if (query.status && query.status !== "ALL") {
    where.status = query.status;
  }

  if (query.search?.trim()) {
    const search = query.search.trim();
    where.OR = [
      { tableNumber: { contains: search, mode: "insensitive" } },
      { tableName: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

async function assertUniqueTableNumber(
  branchId: string,
  tableNumber: string,
  excludeTableId?: string,
): Promise<void> {
  const existing = await prisma.restaurantTable.findFirst({
    where: {
      branchId,
      tableNumber: normalizeTableNumber(tableNumber),
      ...(excludeTableId ? { NOT: { id: excludeTableId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Table number must be unique within this branch");
  }
}

async function assertFloorInBranch(
  businessId: string,
  branchId: string,
  floorId: string,
): Promise<void> {
  const floor = await prisma.restaurantFloor.findFirst({
    where: { id: floorId, businessId, branchId },
    select: { id: true },
  });

  if (!floor) {
    throw new Error("Floor not found in this branch");
  }
}

async function getOwnedTable(
  businessId: string,
  branchId: string,
  tableId: string,
): Promise<TableWithFloor> {
  const table = await prisma.restaurantTable.findFirst({
    where: { id: tableId, businessId, branchId },
    include: tableInclude,
  });

  if (!table) {
    throw new Error("Table not found");
  }

  return table;
}

export async function listManagedTables(
  businessId: string,
  query: TableListQuery,
): Promise<TableListResult> {
  const pageSize = query.pageSize ?? TABLE_LIST_PAGE_SIZE;
  const page = Math.max(1, query.page ?? 1);
  const where = buildTableWhere(businessId, query);

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

  return {
    items: tables.map(serializeTable),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listFloorTables(
  businessId: string,
  branchId: string,
  floorId: string,
): Promise<TableManagementRecord[]> {
  const tables = await prisma.restaurantTable.findMany({
    where: { businessId, branchId, floorId, status: { not: "ARCHIVED" } },
    include: tableInclude,
    orderBy: [{ tableNumber: "asc" }],
  });

  return tables.map(serializeTable);
}

export async function getManagedTable(
  businessId: string,
  branchId: string,
  tableId: string,
): Promise<TableManagementRecord> {
  const table = await getOwnedTable(businessId, branchId, tableId);
  return serializeTable(table);
}

export async function createManagedTable(
  ownerId: string,
  input: TableManagementInput,
): Promise<TableManagementRecord> {
  validateTableInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  await assertFloorInBranch(businessId, input.branchId, input.floorId);
  const tableNumber = normalizeTableNumber(input.tableNumber);
  await assertUniqueTableNumber(input.branchId, tableNumber);

  const table = await prisma.restaurantTable.create({
    data: {
      businessId,
      branchId: input.branchId,
      floorId: input.floorId,
      tableNumber,
      tableName: input.tableName?.trim() || null,
      capacity: input.capacity,
      minimumCapacity: input.minimumCapacity ?? 1,
      shape: input.shape ?? "SQUARE",
      positionX: input.positionX ?? 0,
      positionY: input.positionY ?? 0,
      width: input.width ?? 80,
      height: input.height ?? 80,
      rotation: input.rotation ?? 0,
      isReservable: input.isReservable ?? true,
      isMergeable: input.isMergeable ?? true,
      notes: input.notes?.trim() || null,
      status: "AVAILABLE",
    },
    include: tableInclude,
  });

  return serializeTable(table);
}

export async function updateManagedTable(
  ownerId: string,
  tableId: string,
  input: TableManagementInput,
): Promise<TableManagementRecord> {
  validateTableInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  await getOwnedTable(businessId, input.branchId, tableId);
  await assertFloorInBranch(businessId, input.branchId, input.floorId);
  const tableNumber = normalizeTableNumber(input.tableNumber);
  await assertUniqueTableNumber(input.branchId, tableNumber, tableId);

  const table = await prisma.restaurantTable.update({
    where: { id: tableId },
    data: {
      floorId: input.floorId,
      tableNumber,
      tableName: input.tableName?.trim() || null,
      capacity: input.capacity,
      minimumCapacity: input.minimumCapacity ?? 1,
      shape: input.shape,
      positionX: input.positionX,
      positionY: input.positionY,
      width: input.width,
      height: input.height,
      rotation: input.rotation,
      isReservable: input.isReservable,
      isMergeable: input.isMergeable,
      notes: input.notes?.trim() || null,
    },
    include: tableInclude,
  });

  return serializeTable(table);
}

export async function duplicateManagedTable(
  ownerId: string,
  branchId: string,
  tableId: string,
): Promise<TableManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedTable(businessId, branchId, tableId);
  let tableNumber = buildDuplicateTableNumber(existing.tableNumber);

  while (
    await prisma.restaurantTable.findFirst({
      where: { branchId, tableNumber },
      select: { id: true },
    })
  ) {
    tableNumber = buildDuplicateTableNumber(tableNumber);
  }

  const table = await prisma.restaurantTable.create({
    data: {
      businessId,
      branchId,
      floorId: existing.floorId,
      tableNumber,
      tableName: existing.tableName ? `${existing.tableName} (Copy)` : null,
      capacity: existing.capacity,
      minimumCapacity: existing.minimumCapacity,
      shape: existing.shape,
      positionX: existing.positionX + 40,
      positionY: existing.positionY + 40,
      width: existing.width,
      height: existing.height,
      rotation: existing.rotation,
      isReservable: existing.isReservable,
      isMergeable: existing.isMergeable,
      notes: existing.notes,
      status: "AVAILABLE",
    },
    include: tableInclude,
  });

  return serializeTable(table);
}

export async function archiveManagedTable(
  ownerId: string,
  branchId: string,
  tableId: string,
): Promise<TableManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  await getOwnedTable(businessId, branchId, tableId);

  const table = await prisma.restaurantTable.update({
    where: { id: tableId },
    data: { status: "ARCHIVED", mergedIntoTableId: null },
    include: tableInclude,
  });

  return serializeTable(table);
}

export async function restoreManagedTable(
  ownerId: string,
  branchId: string,
  tableId: string,
): Promise<TableManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  await getOwnedTable(businessId, branchId, tableId);

  const table = await prisma.restaurantTable.update({
    where: { id: tableId },
    data: { status: "AVAILABLE", mergedIntoTableId: null },
    include: tableInclude,
  });

  return serializeTable(table);
}

export async function deleteManagedTable(
  ownerId: string,
  branchId: string,
  tableId: string,
): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  await getOwnedTable(businessId, branchId, tableId);
  await prisma.restaurantTable.delete({ where: { id: tableId } });
}

export async function updateTablePositions(
  ownerId: string,
  branchId: string,
  positions: TablePositionInput[],
): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);

  await prisma.$transaction(
    positions.map((position) =>
      prisma.restaurantTable.updateMany({
        where: { id: position.tableId, businessId, branchId },
        data: {
          positionX: position.positionX,
          positionY: position.positionY,
          rotation: position.rotation ?? 0,
        },
      }),
    ),
  );
}

export async function moveManagedTable(
  ownerId: string,
  input: MoveTableInput,
): Promise<TableManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  await getOwnedTable(businessId, input.branchId, input.tableId);
  await assertFloorInBranch(businessId, input.branchId, input.targetFloorId);

  const table = await prisma.restaurantTable.update({
    where: { id: input.tableId },
    data: { floorId: input.targetFloorId },
    include: tableInclude,
  });

  return serializeTable(table);
}

export async function mergeManagedTables(
  ownerId: string,
  input: MergeTablesInput,
): Promise<TableManagementRecord> {
  if (input.sourceTableIds.length === 0) {
    throw new Error("Select at least one table to merge");
  }

  if (input.sourceTableIds.includes(input.targetTableId)) {
    throw new Error("Target table cannot be included in source tables");
  }

  const businessId = await getOwnedBusinessId(ownerId);

  return prisma.$transaction(async (tx) => {
    const tables = await tx.restaurantTable.findMany({
      where: {
        businessId,
        branchId: input.branchId,
        id: { in: [input.targetTableId, ...input.sourceTableIds] },
      },
      include: tableInclude,
    });

    const target = tables.find((table) => table.id === input.targetTableId);
    if (!target) {
      throw new Error("Target table not found");
    }

    if (!target.isMergeable) {
      throw new Error("Target table is not mergeable");
    }

    const sources = tables.filter((table) => input.sourceTableIds.includes(table.id));
    if (sources.length !== input.sourceTableIds.length) {
      throw new Error("One or more source tables not found");
    }

    const mergedCapacity =
      target.capacity + sources.reduce((total, table) => total + table.capacity, 0);

    await tx.restaurantTable.update({
      where: { id: target.id },
      data: { capacity: mergedCapacity, status: "OCCUPIED" },
    });

    for (const source of sources) {
      await tx.restaurantTable.update({
        where: { id: source.id },
        data: {
          status: "OUT_OF_SERVICE" as RestaurantTableStatus,
          mergedIntoTableId: target.id,
        },
      });
    }

    const updated = await tx.restaurantTable.findFirstOrThrow({
      where: { id: target.id },
      include: tableInclude,
    });

    return serializeTable(updated);
  });
}

export async function splitManagedTables(
  ownerId: string,
  input: SplitTablesInput,
): Promise<TableManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);

  return prisma.$transaction(async (tx) => {
    const target = await tx.restaurantTable.findFirst({
      where: { id: input.targetTableId, businessId, branchId: input.branchId },
      include: tableInclude,
    });

    if (!target) {
      throw new Error("Target table not found");
    }

    const sources = await tx.restaurantTable.findMany({
      where: {
        businessId,
        branchId: input.branchId,
        id: { in: input.sourceTableIds },
        mergedIntoTableId: target.id,
      },
      include: tableInclude,
    });

    if (sources.length !== input.sourceTableIds.length) {
      throw new Error("One or more merged tables were not found");
    }

    let restoredCapacity = 0;

    for (const source of sources) {
      restoredCapacity += source.capacity;
      await tx.restaurantTable.update({
        where: { id: source.id },
        data: {
          status: "AVAILABLE",
          mergedIntoTableId: null,
        },
      });
    }

    const nextCapacity = Math.max(target.capacity - restoredCapacity, target.minimumCapacity);

    const updated = await tx.restaurantTable.update({
      where: { id: target.id },
      data: {
        capacity: nextCapacity,
        status: "AVAILABLE",
      },
      include: tableInclude,
    });

    return serializeTable(updated);
  });
}
