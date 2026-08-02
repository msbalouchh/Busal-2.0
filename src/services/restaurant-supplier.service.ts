import "server-only";

import type { Supplier } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { SUPPLIER_LIST_PAGE_SIZE } from "@/modules/inventory-supplier-management/constants/routes";
import {
  buildSupplierListWhere,
  validateSupplierInput,
} from "@/modules/inventory-supplier-management/lib/inventory-supplier-validation";
import type {
  SupplierInput,
  SupplierListQuery,
  SupplierListResult,
  SupplierRecord,
} from "@/modules/inventory-supplier-management/types/inventory-supplier-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

function serializeSupplier(record: Supplier, purchaseOrderCount = 0): SupplierRecord {
  return {
    id: record.id,
    businessId: record.businessId,
    name: record.name,
    contactPerson: record.contactName,
    email: record.email,
    phone: record.phone,
    website: record.website,
    address: record.address,
    city: record.city,
    country: record.country,
    notes: record.notes,
    status: record.status,
    purchaseOrderCount,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listManagedSuppliers(
  ownerId: string,
  query: SupplierListQuery,
): Promise<SupplierListResult> {
  const businessId = await getOwnedBusinessId(ownerId);
  const pageSize = query.pageSize ?? SUPPLIER_LIST_PAGE_SIZE;
  const page = query.page ?? 1;
  const where = buildSupplierListWhere(businessId, query);

  const [total, records] = await Promise.all([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { purchaseOrders: true } } },
    }),
  ]);

  return {
    items: records.map((record) => serializeSupplier(record, record._count.purchaseOrders)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getManagedSupplier(
  ownerId: string,
  supplierId: string,
): Promise<SupplierRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const record = await prisma.supplier.findFirst({
    where: { id: supplierId, businessId, deletedAt: null },
    include: { _count: { select: { purchaseOrders: true } } },
  });
  if (!record) throw new Error("Supplier not found");
  return serializeSupplier(record, record._count.purchaseOrders);
}

export async function createManagedSupplier(
  ownerId: string,
  input: SupplierInput,
): Promise<SupplierRecord> {
  validateSupplierInput(input);
  const businessId = await getOwnedBusinessId(ownerId);

  const duplicate = await prisma.supplier.findFirst({
    where: { businessId, name: input.name.trim(), deletedAt: null },
  });
  if (duplicate) throw new Error("Supplier with this name already exists");

  const record = await prisma.supplier.create({
    data: {
      businessId,
      name: input.name.trim(),
      contactName: input.contactPerson?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      website: input.website?.trim() || null,
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      country: input.country?.trim() || null,
      notes: input.notes?.trim() || null,
      status: input.status ?? "ACTIVE",
    },
  });

  return serializeSupplier(record);
}

export async function updateManagedSupplier(
  ownerId: string,
  supplierId: string,
  input: SupplierInput,
): Promise<SupplierRecord> {
  validateSupplierInput(input);
  await getManagedSupplier(ownerId, supplierId);

  const record = await prisma.supplier.update({
    where: { id: supplierId },
    data: {
      name: input.name.trim(),
      contactName: input.contactPerson?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      website: input.website?.trim() || null,
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      country: input.country?.trim() || null,
      notes: input.notes?.trim() || null,
      status: input.status,
    },
    include: { _count: { select: { purchaseOrders: true } } },
  });

  return serializeSupplier(record, record._count.purchaseOrders);
}

export async function archiveManagedSupplier(ownerId: string, supplierId: string): Promise<void> {
  await getManagedSupplier(ownerId, supplierId);
  await prisma.supplier.update({
    where: { id: supplierId },
    data: { status: "ARCHIVED", deletedAt: new Date() },
  });
}

export async function listSuppliersForSelect(
  ownerId: string,
): Promise<Array<{ id: string; label: string }>> {
  const businessId = await getOwnedBusinessId(ownerId);
  const records = await prisma.supplier.findMany({
    where: { businessId, deletedAt: null, status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return records.map((record) => ({ id: record.id, label: record.name }));
}
