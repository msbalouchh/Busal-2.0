import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { FLOOR_LIST_PAGE_SIZE } from "@/modules/floor-table-management/constants/routes";
import {
  buildDuplicateFloorName,
  normalizeFloorName,
  validateFloorInput,
  validateFloorStatusTransition,
} from "@/modules/floor-table-management/lib/floor-table-validation";
import type {
  FloorListQuery,
  FloorListResult,
  FloorManagementInput,
  FloorManagementRecord,
  FloorSortField,
  FloorTableDashboardStats,
} from "@/modules/floor-table-management/types/floor-table-management-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

type FloorWithCount = Prisma.RestaurantFloorGetPayload<{
  include: { _count: { select: { tables: true } } };
}>;

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

async function assertBranchInBusiness(businessId: string, branchId: string): Promise<void> {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, businessId },
    select: { id: true },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }
}

function serializeFloor(floor: FloorWithCount): FloorManagementRecord {
  return {
    id: floor.id,
    businessId: floor.businessId,
    branchId: floor.branchId,
    name: floor.name,
    description: floor.description,
    displayOrder: floor.displayOrder,
    status: floor.status,
    tableCount: floor._count.tables,
    createdAt: floor.createdAt.toISOString(),
    updatedAt: floor.updatedAt.toISOString(),
  };
}

const floorInclude = {
  _count: { select: { tables: true } },
} satisfies Prisma.RestaurantFloorInclude;

function resolveFloorOrderBy(
  sortBy: FloorSortField = "displayOrder",
  sortDirection: "asc" | "desc" = "asc",
): Prisma.RestaurantFloorOrderByWithRelationInput[] {
  switch (sortBy) {
    case "name":
      return [{ name: sortDirection }];
    case "createdAt":
      return [{ createdAt: sortDirection }];
    case "status":
      return [{ status: sortDirection }, { displayOrder: "asc" }];
    case "displayOrder":
    default:
      return [{ displayOrder: sortDirection }, { name: "asc" }];
  }
}

function buildFloorWhere(
  businessId: string,
  query: FloorListQuery,
): Prisma.RestaurantFloorWhereInput {
  const where: Prisma.RestaurantFloorWhereInput = {
    businessId,
    branchId: query.branchId,
  };

  if (query.status && query.status !== "ALL") {
    where.status = query.status;
  }

  if (query.search?.trim()) {
    const search = query.search.trim();
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

async function assertUniqueFloorName(
  branchId: string,
  name: string,
  excludeFloorId?: string,
): Promise<void> {
  const existing = await prisma.restaurantFloor.findFirst({
    where: {
      branchId,
      name: normalizeFloorName(name),
      ...(excludeFloorId ? { NOT: { id: excludeFloorId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Floor name must be unique within this branch");
  }
}

async function getOwnedFloor(
  businessId: string,
  branchId: string,
  floorId: string,
): Promise<FloorWithCount> {
  const floor = await prisma.restaurantFloor.findFirst({
    where: { id: floorId, businessId, branchId },
    include: floorInclude,
  });

  if (!floor) {
    throw new Error("Floor not found");
  }

  return floor;
}

export async function getFloorTableDashboardStats(
  businessId: string,
  branchId: string,
): Promise<FloorTableDashboardStats> {
  const [totalFloors, activeFloors, totalTables, availableTables, occupiedTables, reservedTables] =
    await Promise.all([
      prisma.restaurantFloor.count({ where: { businessId, branchId } }),
      prisma.restaurantFloor.count({ where: { businessId, branchId, status: "ACTIVE" } }),
      prisma.restaurantTable.count({ where: { businessId, branchId } }),
      prisma.restaurantTable.count({ where: { businessId, branchId, status: "AVAILABLE" } }),
      prisma.restaurantTable.count({ where: { businessId, branchId, status: "OCCUPIED" } }),
      prisma.restaurantTable.count({ where: { businessId, branchId, status: "RESERVED" } }),
    ]);

  return {
    totalFloors,
    activeFloors,
    totalTables,
    availableTables,
    occupiedTables,
    reservedTables,
  };
}

export async function listManagedFloors(
  businessId: string,
  query: FloorListQuery,
): Promise<FloorListResult> {
  const pageSize = query.pageSize ?? FLOOR_LIST_PAGE_SIZE;
  const page = Math.max(1, query.page ?? 1);
  const where = buildFloorWhere(businessId, query);

  const [floors, total] = await Promise.all([
    prisma.restaurantFloor.findMany({
      where,
      include: floorInclude,
      orderBy: resolveFloorOrderBy(query.sortBy, query.sortDirection),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.restaurantFloor.count({ where }),
  ]);

  return {
    items: floors.map(serializeFloor),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getManagedFloor(
  businessId: string,
  branchId: string,
  floorId: string,
): Promise<FloorManagementRecord> {
  const floor = await getOwnedFloor(businessId, branchId, floorId);
  return serializeFloor(floor);
}

export async function createManagedFloor(
  ownerId: string,
  input: FloorManagementInput,
): Promise<FloorManagementRecord> {
  validateFloorInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, input.branchId);
  const name = normalizeFloorName(input.name);
  await assertUniqueFloorName(input.branchId, name);

  const floor = await prisma.restaurantFloor.create({
    data: {
      businessId,
      branchId: input.branchId,
      name,
      description: input.description?.trim() || null,
      displayOrder: input.displayOrder ?? 0,
      status: "ACTIVE",
    },
    include: floorInclude,
  });

  return serializeFloor(floor);
}

export async function updateManagedFloor(
  ownerId: string,
  floorId: string,
  input: FloorManagementInput,
): Promise<FloorManagementRecord> {
  validateFloorInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  await getOwnedFloor(businessId, input.branchId, floorId);
  const name = normalizeFloorName(input.name);
  await assertUniqueFloorName(input.branchId, name, floorId);

  const floor = await prisma.restaurantFloor.update({
    where: { id: floorId },
    data: {
      name,
      description: input.description?.trim() || null,
      displayOrder: input.displayOrder,
    },
    include: floorInclude,
  });

  return serializeFloor(floor);
}

export async function duplicateManagedFloor(
  ownerId: string,
  branchId: string,
  floorId: string,
): Promise<FloorManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedFloor(businessId, branchId, floorId);
  let duplicateName = buildDuplicateFloorName(existing.name);

  while (
    await prisma.restaurantFloor.findFirst({
      where: { branchId, name: duplicateName },
      select: { id: true },
    })
  ) {
    duplicateName = buildDuplicateFloorName(duplicateName);
  }

  const floor = await prisma.restaurantFloor.create({
    data: {
      businessId,
      branchId,
      name: duplicateName,
      description: existing.description,
      displayOrder: existing.displayOrder + 1,
      status: "INACTIVE",
    },
    include: floorInclude,
  });

  return serializeFloor(floor);
}

export async function archiveManagedFloor(
  ownerId: string,
  branchId: string,
  floorId: string,
): Promise<FloorManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedFloor(businessId, branchId, floorId);
  validateFloorStatusTransition(existing.status, "ARCHIVED");

  const floor = await prisma.restaurantFloor.update({
    where: { id: floorId },
    data: { status: "ARCHIVED" },
    include: floorInclude,
  });

  return serializeFloor(floor);
}

export async function restoreManagedFloor(
  ownerId: string,
  branchId: string,
  floorId: string,
): Promise<FloorManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedFloor(businessId, branchId, floorId);
  validateFloorStatusTransition(existing.status, "ACTIVE");

  const floor = await prisma.restaurantFloor.update({
    where: { id: floorId },
    data: { status: "ACTIVE" },
    include: floorInclude,
  });

  return serializeFloor(floor);
}

export async function deleteManagedFloor(
  ownerId: string,
  branchId: string,
  floorId: string,
): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  await getOwnedFloor(businessId, branchId, floorId);
  await prisma.restaurantFloor.delete({ where: { id: floorId } });
}

export async function listBranchFloorsForSelect(
  businessId: string,
  branchId: string,
): Promise<Array<{ id: string; name: string }>> {
  const floors = await prisma.restaurantFloor.findMany({
    where: { businessId, branchId, status: { not: "ARCHIVED" } },
    select: { id: true, name: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  return floors;
}
