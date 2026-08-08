import { z } from "zod";

import {
  ORDER_SOURCES,
  ORDER_STATUSES,
  ORDER_TYPES,
} from "@/modules/orders/constants/order-status";

const orderStatusSchema = z.enum([
  ORDER_STATUSES.DRAFT,
  ORDER_STATUSES.PENDING,
  ORDER_STATUSES.CONFIRMED,
  ORDER_STATUSES.PREPARING,
  ORDER_STATUSES.READY,
  ORDER_STATUSES.SERVED,
  ORDER_STATUSES.OUT_FOR_DELIVERY,
  ORDER_STATUSES.COMPLETED,
  ORDER_STATUSES.CANCELLED,
  ORDER_STATUSES.REFUNDED,
]);

const orderTypeSchema = z.enum([
  ORDER_TYPES.DINE_IN,
  ORDER_TYPES.TAKEAWAY,
  ORDER_TYPES.DELIVERY,
  ORDER_TYPES.QR_ORDERING,
  ORDER_TYPES.PHONE,
  ORDER_TYPES.FUTURE,
]);

const orderSourceSchema = z.enum([
  ORDER_SOURCES.POS,
  ORDER_SOURCES.QR,
  ORDER_SOURCES.PHONE,
  ORDER_SOURCES.WEB,
  ORDER_SOURCES.MARKETPLACE,
  ORDER_SOURCES.AI_AGENT,
  ORDER_SOURCES.STAFF,
]);

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string().trim().min(1),
  quantity: z.number().int().min(1),
  unitPricePence: z.number().int().min(0),
  modifiers: z.array(z.string()).optional(),
  modifierOptionIds: z.array(z.string().uuid()).optional(),
  notes: z.string().optional().nullable(),
});

export const orderSearchSchema = z.object({
  query: z.string().optional(),
  status: orderStatusSchema.optional(),
  orderType: orderTypeSchema.optional(),
  customerId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.enum(["placedAt", "total", "status", "orderNumber"]).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  includeArchived: z.coerce.boolean().optional(),
});

export const createOrderSchema = z.object({
  branchId: z.string().uuid().optional(),
  customerId: z.string().uuid().nullable().optional(),
  customerName: z.string().trim().optional().nullable(),
  orderType: orderTypeSchema,
  source: orderSourceSchema,
  tableId: z.string().uuid().nullable().optional(),
  reservationId: z.string().uuid().nullable().optional(),
  qrSessionId: z.string().uuid().nullable().optional(),
  scheduledFor: z.string().optional().nullable(),
  items: z.array(orderItemSchema).min(1),
  notes: z.string().optional(),
  discountAmountPence: z.number().int().min(0).optional(),
  serviceChargePence: z.number().int().min(0).optional(),
  deliveryChargePence: z.number().int().min(0).optional(),
});

export const modifyOrderSchema = z.object({
  orderId: z.string().uuid(),
  status: orderStatusSchema.optional(),
  tableId: z.string().uuid().nullable().optional(),
  customerId: z.string().uuid().nullable().optional(),
  customerName: z.string().trim().nullable().optional(),
  scheduledFor: z.string().nullable().optional(),
  items: z.array(orderItemSchema).optional(),
  note: z.string().optional(),
  discountAmountPence: z.number().int().min(0).optional(),
  serviceChargePence: z.number().int().min(0).optional(),
});

export const cancelOrderSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().trim().optional(),
});

export const refundOrderSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().trim().optional(),
});

export const assignOrderTableSchema = z.object({
  orderId: z.string().uuid(),
  tableId: z.string().uuid(),
});

export const assignOrderCustomerSchema = z.object({
  orderId: z.string().uuid(),
  customerId: z.string().uuid(),
  customerName: z.string().trim().optional(),
});

export const transferOrderSchema = z.object({
  orderId: z.string().uuid(),
  targetBranchId: z.string().uuid(),
  targetTableId: z.string().uuid().optional(),
});

export const mergeOrdersSchema = z.object({
  targetOrderId: z.string().uuid(),
  sourceOrderIds: z.array(z.string().uuid()).min(1),
});

export const splitOrderSchema = z.object({
  orderId: z.string().uuid(),
  itemIds: z.array(z.string().uuid()).min(1),
});

export const bulkUpdateOrdersSchema = z.object({
  orderIds: z.array(z.string().uuid()).min(1),
  status: orderStatusSchema.optional(),
});

export const addOrderNoteSchema = z.object({
  orderId: z.string().uuid(),
  content: z.string().trim().min(1),
  isInternal: z.boolean().optional(),
});

export type OrderSearchInput = z.infer<typeof orderSearchSchema>;
export type CreateOrderSchemaInput = z.infer<typeof createOrderSchema>;
export type ModifyOrderSchemaInput = z.infer<typeof modifyOrderSchema>;
export type BulkUpdateOrdersSchemaInput = z.infer<typeof bulkUpdateOrdersSchema>;
export type MergeOrdersSchemaInput = z.infer<typeof mergeOrdersSchema>;
export type SplitOrderSchemaInput = z.infer<typeof splitOrderSchema>;
