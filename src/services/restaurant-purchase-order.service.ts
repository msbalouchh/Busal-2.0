import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PURCHASE_ORDER_LIST_PAGE_SIZE } from "@/modules/inventory-supplier-management/constants/routes";
import {
  buildPurchaseOrderListWhere,
  decimal,
  roundMoney,
  roundQuantity,
  validatePurchaseOrderInput,
} from "@/modules/inventory-supplier-management/lib/inventory-supplier-validation";
import type {
  PurchaseOrderInput,
  PurchaseOrderListQuery,
  PurchaseOrderListResult,
  PurchaseOrderRecord,
  ReceiveStockInput,
} from "@/modules/inventory-supplier-management/types/inventory-supplier-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { applyStockChange } from "@/services/restaurant-inventory.service";
import { getManagedSupplier } from "@/services/restaurant-supplier.service";

const purchaseOrderInclude = {
  supplier: { select: { name: true } },
  items: {
    include: { inventoryItem: { select: { name: true, sku: true } } },
    orderBy: [{ createdAt: "asc" as const }],
  },
} satisfies Prisma.PurchaseOrderInclude;

type PurchaseOrderPayload = Prisma.PurchaseOrderGetPayload<{
  include: typeof purchaseOrderInclude;
}>;

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

async function assertBranchInBusiness(businessId: string, branchId: string): Promise<void> {
  const branch = await prisma.branch.findFirst({ where: { id: branchId, businessId } });
  if (!branch) throw new Error("Branch not found");
}

async function generatePurchaseOrderNumber(businessId: string): Promise<string> {
  const count = await prisma.purchaseOrder.count({ where: { businessId } });
  return `PO-${String(count + 1).padStart(6, "0")}`;
}

function serializePurchaseOrder(record: PurchaseOrderPayload): PurchaseOrderRecord {
  return {
    id: record.id,
    businessId: record.businessId,
    branchId: record.branchId,
    supplierId: record.supplierId,
    supplierName: record.supplier.name,
    purchaseOrderNumber: record.purchaseOrderNumber,
    status: record.status,
    expectedDeliveryDate: record.expectedDeliveryDate?.toISOString().slice(0, 10) ?? null,
    receivedDate: record.receivedDate?.toISOString().slice(0, 10) ?? null,
    subtotal: decimal(Number(record.subtotal)),
    taxAmount: decimal(Number(record.taxAmount)),
    totalAmount: decimal(Number(record.totalAmount)),
    notes: record.notes,
    items: record.items.map((item) => ({
      id: item.id,
      inventoryItemId: item.inventoryItemId,
      inventoryItemName: item.inventoryItem.name,
      inventoryItemSku: item.inventoryItem.sku,
      quantity: decimal(Number(item.quantity)),
      unitCost: decimal(Number(item.unitCost)),
      totalCost: decimal(Number(item.totalCost)),
      receivedQuantity: decimal(Number(item.receivedQuantity)),
    })),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function loadPurchaseOrder(
  businessId: string,
  branchId: string,
  purchaseOrderId: string,
): Promise<PurchaseOrderPayload> {
  const record = await prisma.purchaseOrder.findFirst({
    where: { id: purchaseOrderId, businessId, branchId },
    include: purchaseOrderInclude,
  });
  if (!record) throw new Error("Purchase order not found");
  return record;
}

function calculatePurchaseOrderTotals(
  items: Array<{ quantity: number; unitCost: number }>,
  taxAmount = 0,
) {
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0));
  const tax = roundMoney(taxAmount);
  return { subtotal, taxAmount: tax, totalAmount: roundMoney(subtotal + tax) };
}

export async function listManagedPurchaseOrders(
  ownerId: string,
  query: PurchaseOrderListQuery,
): Promise<PurchaseOrderListResult> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, query.branchId);

  const pageSize = query.pageSize ?? PURCHASE_ORDER_LIST_PAGE_SIZE;
  const page = query.page ?? 1;
  const where = buildPurchaseOrderListWhere(businessId, query);

  const [total, records] = await Promise.all([
    prisma.purchaseOrder.count({ where }),
    prisma.purchaseOrder.findMany({
      where,
      include: purchaseOrderInclude,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: records.map(serializePurchaseOrder),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getManagedPurchaseOrder(
  ownerId: string,
  branchId: string,
  purchaseOrderId: string,
): Promise<PurchaseOrderRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const record = await loadPurchaseOrder(businessId, branchId, purchaseOrderId);
  return serializePurchaseOrder(record);
}

export async function createManagedPurchaseOrder(
  ownerId: string,
  input: PurchaseOrderInput,
): Promise<PurchaseOrderRecord> {
  validatePurchaseOrderInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, input.branchId);
  await getManagedSupplier(ownerId, input.supplierId);

  const totals = calculatePurchaseOrderTotals(input.items, input.taxAmount ?? 0);

  const record = await prisma.purchaseOrder.create({
    data: {
      businessId,
      branchId: input.branchId,
      supplierId: input.supplierId,
      purchaseOrderNumber: await generatePurchaseOrderNumber(businessId),
      status: "DRAFT",
      expectedDeliveryDate: input.expectedDeliveryDate
        ? new Date(input.expectedDeliveryDate)
        : null,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      notes: input.notes?.trim() || null,
      items: {
        create: input.items.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          quantity: roundQuantity(item.quantity),
          unitCost: roundQuantity(item.unitCost),
          totalCost: roundMoney(item.quantity * item.unitCost),
        })),
      },
    },
    include: purchaseOrderInclude,
  });

  return serializePurchaseOrder(record);
}

export async function sendManagedPurchaseOrder(
  ownerId: string,
  branchId: string,
  purchaseOrderId: string,
): Promise<PurchaseOrderRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const record = await loadPurchaseOrder(businessId, branchId, purchaseOrderId);
  if (record.status !== "DRAFT") throw new Error("Only draft purchase orders can be sent");

  const updated = await prisma.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: { status: "SENT" },
    include: purchaseOrderInclude,
  });

  return serializePurchaseOrder(updated);
}

export async function cancelManagedPurchaseOrder(
  ownerId: string,
  branchId: string,
  purchaseOrderId: string,
): Promise<PurchaseOrderRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const record = await loadPurchaseOrder(businessId, branchId, purchaseOrderId);
  if (record.status === "RECEIVED") throw new Error("Received purchase orders cannot be cancelled");

  const updated = await prisma.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: { status: "CANCELLED" },
    include: purchaseOrderInclude,
  });

  return serializePurchaseOrder(updated);
}

export async function receiveManagedPurchaseOrderStock(
  ownerId: string,
  input: ReceiveStockInput,
): Promise<PurchaseOrderRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const record = await loadPurchaseOrder(businessId, input.branchId, input.purchaseOrderId);

  if (record.status === "CANCELLED")
    throw new Error("Cancelled purchase orders cannot be received");
  if (record.status === "DRAFT") throw new Error("Send the purchase order before receiving stock");

  await prisma.$transaction(async (tx) => {
    for (const line of input.lines) {
      const poItem = record.items.find((item) => item.id === line.purchaseOrderItemId);
      if (!poItem) throw new Error("Purchase order item not found");

      const receivedQty = roundQuantity(line.receivedQuantity);
      if (receivedQty <= 0) continue;

      const remaining = roundQuantity(
        decimal(Number(poItem.quantity)) - decimal(Number(poItem.receivedQuantity)),
      );
      if (receivedQty > remaining) {
        throw new Error(`Received quantity exceeds remaining for ${poItem.inventoryItem.sku}`);
      }

      await tx.purchaseOrderItem.update({
        where: { id: poItem.id },
        data: { receivedQuantity: { increment: receivedQty } },
      });
    }

    const refreshedItems = await tx.purchaseOrderItem.findMany({
      where: { purchaseOrderId: record.id },
    });

    const allReceived = refreshedItems.every(
      (item) => decimal(Number(item.receivedQuantity)) >= decimal(Number(item.quantity)),
    );
    const anyReceived = refreshedItems.some((item) => decimal(Number(item.receivedQuantity)) > 0);

    await tx.purchaseOrder.update({
      where: { id: record.id },
      data: {
        status: allReceived ? "RECEIVED" : anyReceived ? "PARTIALLY_RECEIVED" : record.status,
        receivedDate: allReceived ? new Date() : record.receivedDate,
      },
    });
  });

  for (const line of input.lines) {
    const poItem = record.items.find((item) => item.id === line.purchaseOrderItemId);
    if (!poItem || line.receivedQuantity <= 0) continue;

    await applyStockChange(poItem.inventoryItemId, roundQuantity(line.receivedQuantity), {
      transactionType: "PURCHASE",
      referenceType: "PURCHASE_ORDER",
      referenceId: record.id,
      notes: `Received from ${record.purchaseOrderNumber}`,
    });

    const item = await prisma.inventoryItem.findUniqueOrThrow({
      where: { id: poItem.inventoryItemId },
    });
    const unitCost = decimal(Number(poItem.unitCost));
    const currentStock = decimal(Number(item.currentStock));
    const averageCost = decimal(Number(item.averageCost));
    const received = roundQuantity(line.receivedQuantity);
    const previousStock = Math.max(0, currentStock - received);
    const nextAverage =
      currentStock > 0
        ? roundQuantity((previousStock * averageCost + received * unitCost) / currentStock)
        : unitCost;

    await prisma.inventoryItem.update({
      where: { id: poItem.inventoryItemId },
      data: { averageCost: nextAverage },
    });
  }

  return getManagedPurchaseOrder(ownerId, input.branchId, input.purchaseOrderId);
}

export async function getSupplierPurchaseOrders(
  ownerId: string,
  supplierId: string,
): Promise<PurchaseOrderRecord[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  await getManagedSupplier(ownerId, supplierId);

  const records = await prisma.purchaseOrder.findMany({
    where: { businessId, supplierId },
    include: purchaseOrderInclude,
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return records.map(serializePurchaseOrder);
}
