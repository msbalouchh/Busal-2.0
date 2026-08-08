import { z } from "zod";

import {
  INVENTORY_MOVEMENT_TYPES,
  INVENTORY_STOCK_STATUSES,
  PURCHASE_ORDER_STATUSES,
  WASTE_REASONS,
} from "@/modules/inventory/constants/inventory-status";

export const inventorySearchSchema = z.object({
  query: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  locationId: z.string().trim().optional(),
  status: z
    .enum([
      INVENTORY_STOCK_STATUSES.IN_STOCK,
      INVENTORY_STOCK_STATUSES.LOW_STOCK,
      INVENTORY_STOCK_STATUSES.OUT_OF_STOCK,
      INVENTORY_STOCK_STATUSES.EXPIRED,
    ])
    .optional(),
  supplierId: z.string().trim().optional(),
  isPerishable: z.coerce.boolean().optional(),
  isLowStock: z.coerce.boolean().optional(),
  includeArchived: z.coerce.boolean().optional(),
  sortBy: z.enum(["name", "sku", "stock", "updatedAt"]).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const createInventoryItemSchema = z.object({
  categoryId: z.string().trim().min(1),
  unitId: z.string().trim().min(1),
  sku: z.string().trim().min(1).max(64),
  barcode: z.string().trim().max(64).nullable().optional(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).nullable().optional(),
  reorderPoint: z.coerce.number().min(0),
  reorderQuantity: z.coerce.number().min(0),
  parLevel: z.coerce.number().min(0),
  costPerUnitCents: z.coerce.number().int().min(0),
  isPerishable: z.coerce.boolean().optional(),
  shelfLifeDays: z.coerce.number().int().min(1).nullable().optional(),
  initialQuantity: z.coerce.number().min(0).optional(),
  locationId: z.string().trim().optional(),
});

export const updateInventoryItemSchema = createInventoryItemSchema
  .partial()
  .extend({ itemId: z.string().trim().min(1) });

export const updateInventoryStockSchema = z.object({
  itemId: z.string().trim().min(1),
  locationId: z.string().trim().min(1),
  quantityDelta: z.coerce.number(),
  movementType: z.enum([
    INVENTORY_MOVEMENT_TYPES.ADJUSTMENT,
    INVENTORY_MOVEMENT_TYPES.RECEIPT,
    INVENTORY_MOVEMENT_TYPES.SALE,
    INVENTORY_MOVEMENT_TYPES.TRANSFER_IN,
    INVENTORY_MOVEMENT_TYPES.TRANSFER_OUT,
    INVENTORY_MOVEMENT_TYPES.WASTE,
    INVENTORY_MOVEMENT_TYPES.RETURN,
    INVENTORY_MOVEMENT_TYPES.PRODUCTION,
  ]),
  batchId: z.string().trim().optional(),
  referenceType: z.string().trim().optional(),
  referenceId: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
});

export const recordInventoryWasteSchema = z.object({
  itemId: z.string().trim().min(1),
  locationId: z.string().trim().min(1),
  batchId: z.string().trim().optional(),
  reason: z.enum([
    WASTE_REASONS.EXPIRED,
    WASTE_REASONS.SPOILED,
    WASTE_REASONS.PREPARATION,
    WASTE_REASONS.OVERPRODUCTION,
    WASTE_REASONS.CUSTOMER_RETURN,
    WASTE_REASONS.OTHER,
  ]),
  quantity: z.coerce.number().min(0.0001),
  notes: z.string().trim().max(500).optional(),
});

export const createInventoryPurchaseOrderSchema = z.object({
  supplierId: z.string().trim().min(1),
  expectedDeliveryDate: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
  lineItems: z
    .array(
      z.object({
        itemId: z.string().trim().min(1),
        quantity: z.coerce.number().min(0.0001),
        unitCostCents: z.coerce.number().int().min(0),
      }),
    )
    .min(1),
});

export const receiveInventoryGoodsSchema = z.object({
  purchaseOrderId: z.string().trim().min(1),
  locationId: z.string().trim().min(1),
  lineItems: z
    .array(
      z.object({
        purchaseOrderLineId: z.string().trim().min(1),
        quantityReceived: z.coerce.number().min(0),
        quantityAccepted: z.coerce.number().min(0).optional(),
        quantityRejected: z.coerce.number().min(0).optional(),
        expiresAt: z.string().trim().nullable().optional(),
      }),
    )
    .min(1),
  notes: z.string().trim().max(500).optional(),
});

export const createInventoryTransferSchema = z.object({
  fromLocationId: z.string().trim().min(1),
  toLocationId: z.string().trim().min(1),
  itemId: z.string().trim().min(1),
  quantity: z.coerce.number().min(0.0001),
  batchId: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
});

export const inventoryBulkActionSchema = z.object({
  itemIds: z.array(z.string().trim().min(1)).min(1).max(100),
  action: z.enum(["archive", "restore", "delete"]),
});

export const inventoryItemActionSchema = z.object({
  itemId: z.string().trim().min(1),
});

export type InventorySearchSchemaInput = z.infer<typeof inventorySearchSchema>;
export type CreateInventoryItemSchemaInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemSchemaInput = z.infer<typeof updateInventoryItemSchema>;
export type UpdateInventoryStockSchemaInput = z.infer<typeof updateInventoryStockSchema>;
export type RecordInventoryWasteSchemaInput = z.infer<typeof recordInventoryWasteSchema>;
export type CreateInventoryPurchaseOrderSchemaInput = z.infer<
  typeof createInventoryPurchaseOrderSchema
>;
export type ReceiveInventoryGoodsSchemaInput = z.infer<typeof receiveInventoryGoodsSchema>;
export type CreateInventoryTransferSchemaInput = z.infer<typeof createInventoryTransferSchema>;
export type InventoryBulkActionSchemaInput = z.infer<typeof inventoryBulkActionSchema>;
