import "server-only";

import { type Prisma, type StockAdjustmentDirection, type StockMovementType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

import { prisma } from "@/lib/prisma";
import { runInteractiveTransaction } from "@/lib/prisma-transaction";
import { branchFilter } from "@/modules/business-context/utils/branch-scope";
import { logInventoryAudit } from "@/modules/inventory/utils/inventory-audit";
import {
  calculateRequiredQuantity,
  decimalFromInput,
} from "@/modules/inventory/utils/inventory-cost";

export interface StockMovementData {
  id: string;
  ingredientId: string;
  ingredientName: string;
  movementType: StockMovementType;
  quantityChange: string;
  balanceAfter: string;
  orderId: string | null;
  reason: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface StockAdjustmentData {
  id: string;
  ingredientId: string;
  ingredientName: string;
  direction: StockAdjustmentDirection;
  quantity: string;
  reason: string;
  notes: string | null;
  createdAt: Date;
}

export interface StockAdjustmentInput {
  ingredientId: string;
  direction: StockAdjustmentDirection;
  quantity: string | number;
  reason: string;
  notes?: string | null;
}

async function applyStockChange(
  tx: Prisma.TransactionClient,
  input: {
    businessId: string;
    branchId?: string | null;
    ingredientId: string;
    quantityChange: Decimal;
    movementType: StockMovementType;
    staffId?: string | null;
    orderId?: string | null;
    paymentId?: string | null;
    reason?: string | null;
    notes?: string | null;
  },
): Promise<{ movementId: string; balanceAfter: Decimal }> {
  const ingredient = await tx.ingredient.findFirst({
    where: { id: input.ingredientId, businessId: input.businessId, deletedAt: null },
    select: { id: true, currentStock: true, name: true },
  });

  if (!ingredient) {
    throw new Error("Ingredient not found");
  }

  const nextStock = ingredient.currentStock.add(input.quantityChange);

  if (nextStock.lt(0)) {
    throw new Error(`Insufficient stock for ${ingredient.name}`);
  }

  await tx.ingredient.update({
    where: { id: ingredient.id },
    data: { currentStock: nextStock },
  });

  const movement = await tx.stockMovement.create({
    data: {
      businessId: input.businessId,
      branchId: input.branchId ?? null,
      ingredientId: ingredient.id,
      movementType: input.movementType,
      quantityChange: input.quantityChange,
      balanceAfter: nextStock,
      orderId: input.orderId ?? null,
      paymentId: input.paymentId ?? null,
      staffId: input.staffId ?? null,
      reason: input.reason ?? null,
      notes: input.notes ?? null,
    },
  });

  return { movementId: movement.id, balanceAfter: nextStock };
}

export async function createStockAdjustment(
  businessId: string,
  staffId: string | null,
  input: StockAdjustmentInput,
  branchId: string | null = null,
): Promise<StockAdjustmentData> {
  const quantity = decimalFromInput(input.quantity);

  if (quantity.lte(0)) {
    throw new Error("Adjustment quantity must be greater than zero");
  }

  const quantityChange = input.direction === "INCREASE" ? quantity : quantity.mul(-1);

  const adjustment = await runInteractiveTransaction(async (tx) => {
    const { movementId } = await applyStockChange(tx, {
      businessId,
      branchId,
      ingredientId: input.ingredientId,
      quantityChange,
      movementType: "ADJUSTMENT",
      staffId,
      reason: input.reason.trim(),
      notes: input.notes?.trim() || null,
    });

    return tx.stockAdjustment.create({
      data: {
        businessId,
        branchId,
        ingredientId: input.ingredientId,
        staffId,
        direction: input.direction,
        quantity,
        reason: input.reason.trim(),
        notes: input.notes?.trim() || null,
        movementId,
      },
      include: {
        ingredient: { select: { name: true } },
      },
    });
  });

  await logInventoryAudit(businessId, {
    staffId,
    entityType: "stock_adjustment",
    entityId: adjustment.id,
    action: input.direction,
    metadata: { ingredientId: input.ingredientId, quantity: quantity.toString() },
  });

  return {
    id: adjustment.id,
    ingredientId: adjustment.ingredientId,
    ingredientName: adjustment.ingredient.name,
    direction: adjustment.direction,
    quantity: adjustment.quantity.toString(),
    reason: adjustment.reason,
    notes: adjustment.notes,
    createdAt: adjustment.createdAt,
  };
}

export async function listStockMovements(
  businessId: string,
  branchId: string | null = null,
): Promise<StockMovementData[]> {
  const movements = await prisma.stockMovement.findMany({
    where: { businessId, ...branchFilter(branchId) },
    orderBy: [{ createdAt: "desc" }],
    include: {
      ingredient: { select: { name: true } },
    },
    take: 100,
  });

  return movements.map((movement) => ({
    id: movement.id,
    ingredientId: movement.ingredientId,
    ingredientName: movement.ingredient.name,
    movementType: movement.movementType,
    quantityChange: movement.quantityChange.toString(),
    balanceAfter: movement.balanceAfter.toString(),
    orderId: movement.orderId,
    reason: movement.reason,
    notes: movement.notes,
    createdAt: movement.createdAt,
  }));
}

export async function deductStockForCompletedOrder(
  businessId: string,
  orderId: string,
  staffId: string | null,
  paymentId?: string | null,
  branchId: string | null = null,
): Promise<void> {
  const order = await prisma.restaurantOrder.findFirst({
    where: { id: orderId, businessId, status: "COMPLETED" },
    include: { items: true },
  });

  if (!order) {
    throw new Error("Completed order not found for stock deduction");
  }

  const legacyOrder = await prisma.legacyOrder.findFirst({
    where: {
      businessId,
      OR: [{ id: orderId }, { orderSessionId: orderId }, { orderNumber: order.orderNumber }],
    },
    select: { id: true },
  });
  const stockOrderId = legacyOrder?.id ?? orderId;

  const existing = await prisma.orderStockDeduction.findUnique({
    where: { orderId: stockOrderId },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  const deductions = new Map<string, Decimal>();

  for (const orderItem of order.items) {
    const menuItem = await prisma.menuItem.findFirst({
      where: { businessId, name: orderItem.productNameSnapshot },
      select: { id: true },
    });

    if (!menuItem) {
      continue;
    }

    const recipe = await prisma.recipe.findUnique({
      where: { menuItemId: menuItem.id },
      include: {
        lines: {
          include: {
            ingredient: {
              select: { id: true, name: true, currentStock: true },
            },
          },
        },
      },
    });

    if (!recipe) {
      continue;
    }

    for (const line of recipe.lines) {
      const required = calculateRequiredQuantity(
        line.quantity,
        orderItem.quantity,
        line.wastePercent,
      );
      const current = deductions.get(line.ingredientId) ?? new Decimal(0);
      deductions.set(line.ingredientId, current.add(required));
    }
  }

  if (deductions.size === 0) {
    await prisma.orderStockDeduction.create({
      data: { businessId, orderId: stockOrderId },
    });
    return;
  }

  await runInteractiveTransaction(async (tx) => {
    for (const [ingredientId, requiredQuantity] of deductions.entries()) {
      await applyStockChange(tx, {
        businessId,
        branchId,
        ingredientId,
        quantityChange: requiredQuantity.mul(-1),
        movementType: "SALE_DEDUCTION",
        staffId,
        orderId: stockOrderId,
        paymentId: paymentId ?? null,
        reason: "Order completed",
      });
    }

    await tx.orderStockDeduction.create({
      data: { businessId, orderId: stockOrderId },
    });
  });

  await logInventoryAudit(businessId, {
    staffId,
    entityType: "order",
    entityId: orderId,
    action: "STOCK_DEDUCTED",
    metadata: {
      ingredientCount: deductions.size,
      paymentId: paymentId ?? null,
    },
  });
}
