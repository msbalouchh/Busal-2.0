import "server-only";

import type { TableStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { branchFilter } from "@/modules/business-context/utils/branch-scope";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import type { BusinessProfileData } from "@/types/business-profile";

const ACTIVE_RESERVATION_STATUSES = ["PENDING", "CONFIRMED", "SEATED"] as const;

export interface TableData {
  id: string;
  businessId: string;
  name: string;
  section: string | null;
  capacity: number;
  status: TableStatus;
  shape: string | null;
  positionX: number | null;
  positionY: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTableInput {
  name: string;
  section?: string;
  capacity: number;
  shape?: string;
  positionX?: number;
  positionY?: number;
  isActive?: boolean;
  branchId?: string | null;
}

export interface UpdateTableInput {
  name?: string;
  section?: string | null;
  capacity?: number;
  shape?: string | null;
  positionX?: number | null;
  positionY?: number | null;
  isActive?: boolean;
}

export interface ListTablesFilters {
  status?: TableStatus;
  section?: string;
  isActive?: boolean;
  branchId?: string | null;
}

export type TableSortValue = "section" | "name" | "capacity";

async function getOwnedBusiness(ownerId: string): Promise<BusinessProfileData & { id: string }> {
  return getOrCreateBusinessForOwner(ownerId);
}

function mapTable(table: {
  id: string;
  businessId: string;
  name: string;
  section: string | null;
  capacity: number;
  status: TableStatus;
  shape: string | null;
  positionX: number | null;
  positionY: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): TableData {
  return {
    id: table.id,
    businessId: table.businessId,
    name: table.name,
    section: table.section,
    capacity: table.capacity,
    status: table.status,
    shape: table.shape,
    positionX: table.positionX,
    positionY: table.positionY,
    isActive: table.isActive,
    createdAt: table.createdAt,
    updatedAt: table.updatedAt,
  };
}

function validateCapacity(capacity: number): void {
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new Error("Capacity must be greater than 0");
  }
}

function normalizeOptionalString(value: string | null | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function assertUniqueTableName(
  businessId: string,
  name: string,
  excludeTableId?: string,
): Promise<void> {
  const existing = await prisma.table.findFirst({
    where: {
      businessId,
      name: name.trim(),
      ...(excludeTableId ? { id: { not: excludeTableId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("A table with this name already exists");
  }
}

async function getTableForBusiness(businessId: string, tableId: string): Promise<TableData> {
  const table = await prisma.table.findFirst({
    where: { id: tableId, businessId },
  });

  if (!table) {
    throw new Error("Table not found");
  }

  return mapTable(table);
}

async function assertNoActiveReservations(businessId: string, tableId: string): Promise<void> {
  const activeReservation = await prisma.reservation.findFirst({
    where: {
      businessId,
      tableId,
      status: { in: [...ACTIVE_RESERVATION_STATUSES] },
    },
    select: { id: true },
  });

  if (activeReservation) {
    throw new Error("Cannot delete table with active reservations");
  }
}

function buildOrderBy(sortBy: TableSortValue) {
  switch (sortBy) {
    case "section":
      return [{ section: "asc" as const }, { name: "asc" as const }];
    case "capacity":
      return [{ capacity: "asc" as const }, { name: "asc" as const }];
    case "name":
    default:
      return [{ name: "asc" as const }];
  }
}

export async function createTable(ownerId: string, input: CreateTableInput): Promise<TableData> {
  const business = await getOwnedBusiness(ownerId);

  if (!input.name.trim()) {
    throw new Error("Table name is required");
  }

  validateCapacity(input.capacity);
  await assertUniqueTableName(business.id, input.name);

  const table = await prisma.table.create({
    data: {
      businessId: business.id,
      branchId: input.branchId ?? null,
      name: input.name.trim(),
      section: normalizeOptionalString(input.section) ?? null,
      capacity: input.capacity,
      status: "AVAILABLE",
      shape: normalizeOptionalString(input.shape) ?? null,
      positionX: input.positionX ?? null,
      positionY: input.positionY ?? null,
      isActive: input.isActive ?? true,
    },
  });

  return mapTable(table);
}

export async function getTableById(ownerId: string, tableId: string): Promise<TableData> {
  const business = await getOwnedBusiness(ownerId);
  return getTableForBusiness(business.id, tableId);
}

export async function listTables(
  ownerId: string,
  filters: ListTablesFilters = {},
  sortBy: TableSortValue = "name",
): Promise<TableData[]> {
  const business = await getOwnedBusiness(ownerId);

  const tables = await prisma.table.findMany({
    where: {
      businessId: business.id,
      ...branchFilter(filters.branchId ?? null),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.section !== undefined ? { section: filters.section.trim() || null } : {}),
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
    },
    orderBy: buildOrderBy(sortBy),
  });

  return tables.map(mapTable);
}

export async function updateTable(
  ownerId: string,
  tableId: string,
  input: UpdateTableInput,
): Promise<TableData> {
  const business = await getOwnedBusiness(ownerId);

  const existing = await prisma.table.findFirst({
    where: { id: tableId, businessId: business.id },
  });

  if (!existing) {
    throw new Error("Table not found");
  }

  if (input.name !== undefined && !input.name.trim()) {
    throw new Error("Table name is required");
  }

  if (input.capacity !== undefined) {
    validateCapacity(input.capacity);
  }

  const nextName = input.name !== undefined ? input.name.trim() : existing.name;

  if (input.name !== undefined) {
    await assertUniqueTableName(business.id, nextName, tableId);
  }

  const table = await prisma.table.update({
    where: { id: tableId },
    data: {
      ...(input.name !== undefined ? { name: nextName } : {}),
      ...(input.section !== undefined
        ? { section: normalizeOptionalString(input.section) ?? null }
        : {}),
      ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
      ...(input.shape !== undefined ? { shape: normalizeOptionalString(input.shape) ?? null } : {}),
      ...(input.positionX !== undefined ? { positionX: input.positionX } : {}),
      ...(input.positionY !== undefined ? { positionY: input.positionY } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });

  return mapTable(table);
}

export async function deleteTable(ownerId: string, tableId: string): Promise<void> {
  const business = await getOwnedBusiness(ownerId);

  const existing = await prisma.table.findFirst({
    where: { id: tableId, businessId: business.id },
  });

  if (!existing) {
    throw new Error("Table not found");
  }

  await assertNoActiveReservations(business.id, tableId);

  await prisma.table.delete({ where: { id: tableId } });
}

export async function updateTableStatus(
  ownerId: string,
  tableId: string,
  status: TableStatus,
): Promise<TableData> {
  const business = await getOwnedBusiness(ownerId);

  const existing = await prisma.table.findFirst({
    where: { id: tableId, businessId: business.id },
  });

  if (!existing) {
    throw new Error("Table not found");
  }

  const table = await prisma.table.update({
    where: { id: tableId },
    data: { status },
  });

  return mapTable(table);
}
