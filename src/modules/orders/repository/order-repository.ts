import "server-only";

import { Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { runInteractiveTransaction } from "@/lib/prisma-transaction";
import {
  ORDER_SOURCES,
  ORDER_STATUSES,
  ORDER_STATUS_TRANSITIONS,
  ORDER_TIMELINE_EVENT_TYPES,
} from "@/modules/orders/constants/order-status";
import type { StoredOrderMeta } from "@/modules/orders/lib/order-mappers";
import {
  appendTimelineEvent,
  composeOrderNotes,
  decimalToPence,
  mapDomainOrderTypeToPrisma,
  mapDomainStatusToPrisma,
  mapOrderToRecord,
  mapPrismaOrderTypeToDomain,
  mapPrismaStatusToDomain,
  mapTimelineTypeForStatus,
  penceToDecimal,
  splitOrderNotes,
  type RestaurantOrderWithRelations,
} from "@/modules/orders/lib/order-mappers";
import type { OrderTenantScope } from "@/modules/orders/lib/order-scope";
import type {
  CreateOrderInput,
  ModifyOrderInput,
  OrderRecord,
  OrderSearchQuery,
} from "@/modules/orders/types/order";
import type {
  BulkUpdateOrdersSchemaInput,
  MergeOrdersSchemaInput,
  SplitOrderSchemaInput,
} from "@/modules/orders/validation/order-schemas";

const DEFAULT_PAGE_SIZE = 25;

const orderInclude = {
  items: { include: { modifiers: true }, orderBy: { createdAt: "asc" } },
  payments: { orderBy: { createdAt: "desc" } },
  customer: { select: { id: true, firstName: true, lastName: true } },
  restaurantTable: { select: { id: true, tableNumber: true, tableName: true } },
  staff: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.RestaurantOrderInclude;

export interface OrderSearchResult {
  records: OrderRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function scopeWhere(scope: OrderTenantScope): Prisma.RestaurantOrderWhereInput {
  return {
    businessId: scope.businessId,
    branchId: scope.branchId,
  };
}

function isArchived(notes: string | null): boolean {
  return splitOrderNotes(notes).meta.archived === true;
}

function buildOrderBy(
  sortBy: OrderSearchQuery["sortBy"] = "placedAt",
  sortDirection: "asc" | "desc" = "desc",
): Prisma.RestaurantOrderOrderByWithRelationInput[] {
  switch (sortBy) {
    case "total":
      return [{ totalAmount: sortDirection }, { placedAt: "desc" }];
    case "status":
      return [{ status: sortDirection }, { placedAt: "desc" }];
    case "orderNumber":
      return [{ orderNumber: sortDirection }];
    case "placedAt":
    default:
      return [{ placedAt: sortDirection }];
  }
}

async function generateOrderNumber(
  businessId: string,
  client: Pick<typeof prisma, "restaurantOrder"> = prisma,
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = randomBytes(2).toString("hex").toUpperCase();
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${suffix}`;
    const existing = await client.restaurantOrder.findFirst({
      where: { businessId, orderNumber },
      select: { id: true },
    });
    if (!existing) {
      return orderNumber;
    }
  }
  throw new Error("Unable to generate order number");
}

function computeTotals(items: CreateOrderInput["items"], discountPence = 0, servicePence = 0, deliveryPence = 0) {
  const subtotalPence = items.reduce((sum, item) => sum + item.quantity * item.unitPricePence, 0);
  const taxPence = Math.round((subtotalPence - discountPence) * 0.2);
  const totalPence = subtotalPence - discountPence + taxPence + servicePence + deliveryPence;
  return { subtotalPence, taxPence, totalPence };
}

async function loadOrder(scope: OrderTenantScope, orderId: string): Promise<RestaurantOrderWithRelations | null> {
  return prisma.restaurantOrder.findFirst({
    where: { id: orderId, ...scopeWhere(scope) },
    include: orderInclude,
  });
}

/** Prisma-backed order repository with tenant scoping. */
export class OrderRepository {
  async list(scope: OrderTenantScope): Promise<OrderRecord[]> {
    const orders = await prisma.restaurantOrder.findMany({
      where: scopeWhere(scope),
      include: orderInclude,
      orderBy: [{ placedAt: "desc" }],
    });

    return orders
      .filter((order) => !isArchived(order.notes))
      .map((order) => mapOrderToRecord(order, scope));
  }

  async findById(scope: OrderTenantScope, orderId: string): Promise<OrderRecord | null> {
    const order = await loadOrder(scope, orderId);
    if (!order || isArchived(order.notes)) {
      return null;
    }
    return mapOrderToRecord(order, scope);
  }

  async findByOrderNumber(scope: OrderTenantScope, orderNumber: string): Promise<OrderRecord | null> {
    const order = await prisma.restaurantOrder.findFirst({
      where: { orderNumber, ...scopeWhere(scope) },
      include: orderInclude,
    });
    if (!order || isArchived(order.notes)) {
      return null;
    }
    return mapOrderToRecord(order, scope);
  }

  async search(scope: OrderTenantScope, query: OrderSearchQuery = {}): Promise<OrderSearchResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? query.limit ?? DEFAULT_PAGE_SIZE;
    const prismaStatus = query.status ? mapDomainStatusToPrisma(query.status) : undefined;

    const where: Prisma.RestaurantOrderWhereInput = {
      ...scopeWhere(scope),
      ...(prismaStatus ? { status: prismaStatus } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.orderType
        ? { orderType: mapDomainOrderTypeToPrisma(query.orderType) }
        : {}),
      ...(query.query
        ? {
            OR: [
              { orderNumber: { contains: query.query, mode: "insensitive" } },
              { notes: { contains: query.query, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.restaurantOrder.findMany({
        where,
        include: orderInclude,
        orderBy: buildOrderBy(query.sortBy, query.sortDirection),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.restaurantOrder.count({ where }),
    ]);

    const records = orders
      .filter((order) => query.includeArchived || !isArchived(order.notes))
      .filter((order) => {
        if (!query.orderType) {
          return true;
        }
        return mapPrismaOrderTypeToDomain(order.orderType, order.qrSessionId) === query.orderType;
      })
      .map((order) => mapOrderToRecord(order, scope));

    return {
      records,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async create(scope: OrderTenantScope, input: CreateOrderInput): Promise<OrderRecord> {
    const discountPence = input.discountAmountPence ?? 0;
    const servicePence = input.serviceChargePence ?? 0;
    const deliveryPence = input.deliveryChargePence ?? 0;
    const { subtotalPence, taxPence, totalPence } = computeTotals(
      input.items,
      discountPence,
      servicePence,
      deliveryPence,
    );

    const meta = {
      source: input.source,
      scheduledFor: input.scheduledFor ?? null,
      timeline: [],
    };

    const orderNumber = await generateOrderNumber(scope.businessId);
    const modifierOptionIds = [
      ...new Set(
        input.items.flatMap((item) => item.modifierOptionIds ?? []).filter(Boolean),
      ),
    ];
    const modifierOptions =
      modifierOptionIds.length > 0
        ? await prisma.modifierOption.findMany({
            where: { id: { in: modifierOptionIds } },
            select: { id: true, name: true, priceAdjustment: true },
          })
        : [];
    const modifierById = new Map(modifierOptions.map((option) => [option.id, option]));

    const order = await runInteractiveTransaction(async (tx) => {
      const created = await tx.restaurantOrder.create({
        data: {
          businessId: scope.businessId,
          branchId: input.branchId,
          orderNumber,
          orderType: mapDomainOrderTypeToPrisma(input.orderType),
          customerId: input.customerId ?? null,
          restaurantTableId: input.tableId ?? null,
          reservationId: input.reservationId ?? null,
          qrSessionId: input.qrSessionId ?? null,
          status: input.source === "pos" ? "PENDING" : "PENDING",
          subtotal: penceToDecimal(subtotalPence),
          discountAmount: penceToDecimal(discountPence),
          taxAmount: penceToDecimal(taxPence),
          serviceCharge: penceToDecimal(servicePence),
          deliveryCharge: penceToDecimal(deliveryPence),
          totalAmount: penceToDecimal(totalPence),
          notes: composeOrderNotes(input.notes ?? null, meta),
        },
      });

      for (const item of input.items) {
        const lineTotal = item.quantity * item.unitPricePence;
        const createdItem = await tx.restaurantOrderItem.create({
          data: {
            orderId: created.id,
            productId: item.productId,
            productNameSnapshot: item.productName,
            quantity: item.quantity,
            unitPrice: penceToDecimal(item.unitPricePence),
            totalAmount: penceToDecimal(lineTotal),
            specialInstructions: item.notes ?? null,
          },
        });

        const modifierRows = (item.modifierOptionIds ?? [])
          .map((modifierOptionId) => modifierById.get(modifierOptionId))
          .filter((option): option is NonNullable<typeof option> => Boolean(option))
          .map((option) => ({
            orderItemId: createdItem.id,
            modifierOptionId: option.id,
            nameSnapshot: option.name,
            priceAdjustment: option.priceAdjustment,
          }));

        if (modifierRows.length > 0) {
          await tx.restaurantOrderItemModifier.createMany({ data: modifierRows });
        }
      }

      return created;
    });

    const refreshed = await loadOrder(scope, order.id);
    if (!refreshed) {
      throw new Error("Failed to load created order");
    }

    const { guestNotes, meta: storedMeta } = splitOrderNotes(refreshed.notes);
    const updatedMeta = appendTimelineEvent(storedMeta, {
      orderId: order.id,
      type: ORDER_TIMELINE_EVENT_TYPES.CREATED,
      title: "Order created",
      description: "New order submitted",
      fromStatus: null,
      toStatus: ORDER_STATUSES.PENDING,
      metadata: { source: input.source },
      occurredAt: refreshed.placedAt.toISOString(),
      createdBy: scope.userId,
    });

    const updated = await prisma.restaurantOrder.update({
      where: { id: order.id },
      data: { notes: composeOrderNotes(guestNotes, updatedMeta) },
      include: orderInclude,
    });

    return mapOrderToRecord(updated, scope);
  }

  async modify(scope: OrderTenantScope, input: ModifyOrderInput): Promise<OrderRecord | null> {
    const existing = await loadOrder(scope, input.orderId);
    if (!existing || isArchived(existing.notes)) {
      return null;
    }

    const { guestNotes, meta } = splitOrderNotes(existing.notes);
    let nextMeta: StoredOrderMeta = {
      ...meta,
      scheduledFor: input.scheduledFor ?? meta.scheduledFor ?? null,
    };
    const currentStatus = mapPrismaStatusToDomain(existing.status, existing.paymentStatus, meta);

    if (input.status && input.status !== currentStatus) {
      const allowed = ORDER_STATUS_TRANSITIONS[currentStatus];
      if (!allowed.includes(input.status)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${input.status}`);
      }

      nextMeta = appendTimelineEvent(nextMeta, {
        orderId: input.orderId,
        type: mapTimelineTypeForStatus(input.status),
        title: "Status updated",
        description: `Order moved to ${input.status.replace("_", " ")}`,
        fromStatus: currentStatus,
        toStatus: input.status,
        metadata: {},
        occurredAt: new Date().toISOString(),
        createdBy: scope.userId,
      });

      if (input.status === ORDER_STATUSES.OUT_FOR_DELIVERY) {
        nextMeta.domainStatus = ORDER_STATUSES.OUT_FOR_DELIVERY;
      } else if (input.status === ORDER_STATUSES.DRAFT) {
        nextMeta.domainStatus = ORDER_STATUSES.DRAFT;
      } else if (input.status === ORDER_STATUSES.REFUNDED) {
        nextMeta.domainStatus = ORDER_STATUSES.REFUNDED;
      } else {
        nextMeta.domainStatus = undefined;
      }
    }

    if (input.note) {
      const note = {
        id: `${input.orderId}-note-${Date.now()}`,
        orderId: input.orderId,
        content: input.note,
        isInternal: true,
        createdBy: scope.userId,
        createdAt: new Date().toISOString(),
      };
      nextMeta = appendTimelineEvent(
        { ...nextMeta, notes: [...(nextMeta.notes ?? []), note] },
        {
          orderId: input.orderId,
          type: ORDER_TIMELINE_EVENT_TYPES.NOTE_ADDED,
          title: "Note added",
          description: input.note,
          fromStatus: null,
          toStatus: null,
          metadata: { noteId: note.id },
          occurredAt: note.createdAt,
          createdBy: scope.userId,
        },
      );
    }

    let subtotal = existing.subtotal;
    let taxAmount = existing.taxAmount;
    let totalAmount = existing.totalAmount;
    let discountAmount = existing.discountAmount;
    let serviceCharge = existing.serviceCharge;

    if (input.items) {
      await runInteractiveTransaction(async (tx) => {
        await tx.restaurantOrderItem.deleteMany({ where: { orderId: input.orderId } });
        if (input.items && input.items.length > 0) {
          await tx.restaurantOrderItem.createMany({
            data: input.items.map((item) => ({
              orderId: input.orderId,
              productId: item.productId,
              productNameSnapshot: item.productName,
              quantity: item.quantity,
              unitPrice: penceToDecimal(item.unitPricePence),
              totalAmount: penceToDecimal(item.quantity * item.unitPricePence),
              specialInstructions: item.notes ?? null,
            })),
          });
        }
      });

      const totals = computeTotals(
        input.items,
        input.discountAmountPence ?? decimalToPence(existing.discountAmount),
        input.serviceChargePence ?? decimalToPence(existing.serviceCharge),
        decimalToPence(existing.deliveryCharge),
      );
      subtotal = penceToDecimal(totals.subtotalPence);
      taxAmount = penceToDecimal(totals.taxPence);
      totalAmount = penceToDecimal(totals.totalPence);
      discountAmount = penceToDecimal(input.discountAmountPence ?? decimalToPence(existing.discountAmount));
      serviceCharge = penceToDecimal(input.serviceChargePence ?? decimalToPence(existing.serviceCharge));
    } else if (input.discountAmountPence !== undefined || input.serviceChargePence !== undefined) {
      const refreshedItems = existing.items.map((item) => ({
        productId: item.productId,
        productName: item.productNameSnapshot,
        quantity: item.quantity,
        unitPricePence: decimalToPence(item.unitPrice),
      }));
      const totals = computeTotals(
        refreshedItems,
        input.discountAmountPence ?? decimalToPence(existing.discountAmount),
        input.serviceChargePence ?? decimalToPence(existing.serviceCharge),
        decimalToPence(existing.deliveryCharge),
      );
      subtotal = penceToDecimal(totals.subtotalPence);
      taxAmount = penceToDecimal(totals.taxPence);
      totalAmount = penceToDecimal(totals.totalPence);
      discountAmount = penceToDecimal(input.discountAmountPence ?? decimalToPence(existing.discountAmount));
      serviceCharge = penceToDecimal(input.serviceChargePence ?? decimalToPence(existing.serviceCharge));
    }

    const updated = await prisma.restaurantOrder.update({
      where: { id: input.orderId },
      data: {
        ...(input.status ? { status: mapDomainStatusToPrisma(input.status) } : {}),
        ...(input.tableId !== undefined ? { restaurantTableId: input.tableId } : {}),
        ...(input.customerId !== undefined ? { customerId: input.customerId } : {}),
        ...(input.status === ORDER_STATUSES.PREPARING ? { kitchenPreparingAt: new Date() } : {}),
        ...(input.status === ORDER_STATUSES.READY ? { kitchenReadyAt: new Date() } : {}),
        ...(input.status === ORDER_STATUSES.SERVED ? { kitchenServedAt: new Date() } : {}),
        ...(input.status === ORDER_STATUSES.COMPLETED
          ? { completedAt: new Date(), paymentStatus: "PAID" }
          : {}),
        ...(input.status === ORDER_STATUSES.CANCELLED ? { cancelledAt: new Date() } : {}),
        subtotal,
        discountAmount,
        taxAmount,
        serviceCharge,
        totalAmount,
        notes: composeOrderNotes(input.note ? guestNotes : guestNotes, nextMeta),
      },
      include: orderInclude,
    });

    return mapOrderToRecord(updated, scope);
  }

  async cancel(scope: OrderTenantScope, orderId: string, reason?: string): Promise<OrderRecord | null> {
    return this.modify(scope, {
      orderId,
      status: ORDER_STATUSES.CANCELLED,
      note: reason,
    });
  }

  async refund(scope: OrderTenantScope, orderId: string, reason?: string): Promise<OrderRecord | null> {
    const existing = await loadOrder(scope, orderId);
    if (!existing) {
      return null;
    }

    await prisma.orderPayment.create({
      data: {
        businessId: scope.businessId,
        branchId: scope.branchId,
        orderId,
        paymentNumber: `REF-${Date.now()}`,
        paymentMethod: "CARD",
        status: "REFUNDED",
        subtotal: existing.subtotal,
        amountPaid: existing.totalAmount,
        paidAt: new Date(),
        transactionReference: reason ?? "manual-refund",
      },
    });

    const updated = await prisma.restaurantOrder.update({
      where: { id: orderId },
      data: { paymentStatus: "REFUNDED" },
      include: orderInclude,
    });

    const { guestNotes, meta } = splitOrderNotes(updated.notes);
    const nextMeta = appendTimelineEvent(
      { ...meta, domainStatus: ORDER_STATUSES.REFUNDED },
      {
        orderId,
        type: ORDER_TIMELINE_EVENT_TYPES.REFUNDED,
        title: "Order refunded",
        description: reason ?? "Refund processed",
        fromStatus: ORDER_STATUSES.COMPLETED,
        toStatus: ORDER_STATUSES.REFUNDED,
        metadata: {},
        occurredAt: new Date().toISOString(),
        createdBy: scope.userId,
      },
    );

    const finalOrder = await prisma.restaurantOrder.update({
      where: { id: orderId },
      data: { notes: composeOrderNotes(guestNotes, nextMeta) },
      include: orderInclude,
    });

    return mapOrderToRecord(finalOrder, scope);
  }

  async assignTable(scope: OrderTenantScope, orderId: string, tableId: string): Promise<OrderRecord | null> {
    return this.modify(scope, { orderId, tableId });
  }

  async assignCustomer(
    scope: OrderTenantScope,
    orderId: string,
    customerId: string,
  ): Promise<OrderRecord | null> {
    return this.modify(scope, { orderId, customerId });
  }

  async transfer(
    scope: OrderTenantScope,
    orderId: string,
    targetBranchId: string,
    targetTableId?: string,
  ): Promise<OrderRecord | null> {
    const existing = await loadOrder(scope, orderId);
    if (!existing) {
      return null;
    }

    const branch = await prisma.branch.findFirst({
      where: { id: targetBranchId, businessId: scope.businessId },
    });
    if (!branch) {
      throw new Error("Target branch not found");
    }

    const { guestNotes, meta } = splitOrderNotes(existing.notes);
    const nextMeta = {
      ...meta,
      transferHistory: [
        ...(meta.transferHistory ?? []),
        { branchId: targetBranchId, transferredAt: new Date().toISOString() },
      ],
    };

    const updated = await prisma.restaurantOrder.update({
      where: { id: orderId },
      data: {
        branchId: targetBranchId,
        restaurantTableId: targetTableId ?? null,
        notes: composeOrderNotes(guestNotes, nextMeta),
      },
      include: orderInclude,
    });

    return mapOrderToRecord(updated, scope);
  }

  async mergeOrders(scope: OrderTenantScope, input: MergeOrdersSchemaInput): Promise<OrderRecord | null> {
    const target = await loadOrder(scope, input.targetOrderId);
    if (!target) {
      return null;
    }

    for (const sourceId of input.sourceOrderIds) {
      const source = await loadOrder(scope, sourceId);
      if (!source) {
        continue;
      }

      await prisma.restaurantOrderItem.updateMany({
        where: { orderId: sourceId },
        data: { orderId: input.targetOrderId },
      });

      await prisma.restaurantOrder.update({
        where: { id: sourceId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          mergedFromOrderId: input.targetOrderId,
        },
      });
    }

    const refreshed = await loadOrder(scope, input.targetOrderId);
    if (!refreshed) {
      return null;
    }

    const items = refreshed.items.map((item) => ({
      productId: item.productId,
      productName: item.productNameSnapshot,
      quantity: item.quantity,
      unitPricePence: decimalToPence(item.unitPrice),
    }));
    const totals = computeTotals(items, decimalToPence(refreshed.discountAmount), decimalToPence(refreshed.serviceCharge), decimalToPence(refreshed.deliveryCharge));

    const updated = await prisma.restaurantOrder.update({
      where: { id: input.targetOrderId },
      data: {
        subtotal: penceToDecimal(totals.subtotalPence),
        taxAmount: penceToDecimal(totals.taxPence),
        totalAmount: penceToDecimal(totals.totalPence),
      },
      include: orderInclude,
    });

    return mapOrderToRecord(updated, scope);
  }

  async splitOrder(scope: OrderTenantScope, input: SplitOrderSchemaInput): Promise<OrderRecord[]> {
    const source = await loadOrder(scope, input.orderId);
    if (!source) {
      return [];
    }

    const splitItems = source.items.filter((item) => input.itemIds.includes(item.id));
    if (splitItems.length === 0) {
      return [];
    }

    const newOrder = await this.create(scope, {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      orderType: mapPrismaOrderTypeToDomain(source.orderType, source.qrSessionId),
      source: splitOrderNotes(source.notes).meta.source ?? ORDER_SOURCES.POS,
      tableId: source.restaurantTableId,
      items: splitItems.map((item) => ({
        productId: item.productId,
        productName: item.productNameSnapshot,
        quantity: item.quantity,
        unitPricePence: decimalToPence(item.unitPrice),
        notes: item.specialInstructions,
      })),
    });

    await prisma.restaurantOrderItem.deleteMany({
      where: { id: { in: input.itemIds }, orderId: input.orderId },
    });

    const remaining = await this.findById(scope, input.orderId);
    return [newOrder, ...(remaining ? [remaining] : [])];
  }

  async archive(scope: OrderTenantScope, orderId: string): Promise<OrderRecord | null> {
    const existing = await loadOrder(scope, orderId);
    if (!existing) {
      return null;
    }

    const { guestNotes, meta } = splitOrderNotes(existing.notes);
    const updated = await prisma.restaurantOrder.update({
      where: { id: orderId },
      data: {
        notes: composeOrderNotes(guestNotes, {
          ...meta,
          archived: true,
          archivedAt: new Date().toISOString(),
        }),
      },
      include: orderInclude,
    });

    return mapOrderToRecord(updated, scope);
  }

  async restore(scope: OrderTenantScope, orderId: string): Promise<OrderRecord | null> {
    const existing = await loadOrder(scope, orderId);
    if (!existing) {
      return null;
    }

    const { guestNotes, meta } = splitOrderNotes(existing.notes);
    const updated = await prisma.restaurantOrder.update({
      where: { id: orderId },
      data: {
        notes: composeOrderNotes(guestNotes, {
          ...meta,
          archived: false,
          archivedAt: undefined,
        }),
      },
      include: orderInclude,
    });

    return mapOrderToRecord(updated, scope);
  }

  async deleteHard(scope: OrderTenantScope, orderId: string): Promise<boolean> {
    const result = await prisma.restaurantOrder.deleteMany({
      where: { id: orderId, ...scopeWhere(scope) },
    });
    return result.count > 0;
  }

  async bulkUpdate(scope: OrderTenantScope, input: BulkUpdateOrdersSchemaInput): Promise<number> {
    let updated = 0;
    for (const orderId of input.orderIds) {
      if (input.status) {
        const record = await this.modify(scope, { orderId, status: input.status });
        if (record) {
          updated += 1;
        }
      }
    }
    return updated;
  }
}

export const orderRepository = new OrderRepository();
