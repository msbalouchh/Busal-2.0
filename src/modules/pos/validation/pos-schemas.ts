import { z } from "zod";

import {
  POS_DISCOUNT_TYPES,
  POS_ORDER_SOURCES,
  POS_ORDER_STATUSES,
  POS_PAYMENT_TYPES,
  POS_REFUND_REASONS,
} from "@/modules/pos/constants/pos-status";

const posOrderStatusSchema = z.enum([
  POS_ORDER_STATUSES.DRAFT,
  POS_ORDER_STATUSES.OPEN,
  POS_ORDER_STATUSES.HELD,
  POS_ORDER_STATUSES.PAID,
  POS_ORDER_STATUSES.PARTIALLY_PAID,
  POS_ORDER_STATUSES.REFUNDED,
  POS_ORDER_STATUSES.PARTIALLY_REFUNDED,
  POS_ORDER_STATUSES.VOID,
  POS_ORDER_STATUSES.MERGED,
  POS_ORDER_STATUSES.TRANSFERRED,
]);

const posPaymentTypeSchema = z.enum([
  POS_PAYMENT_TYPES.CASH,
  POS_PAYMENT_TYPES.CARD,
  POS_PAYMENT_TYPES.APPLE_PAY,
  POS_PAYMENT_TYPES.GOOGLE_PAY,
  POS_PAYMENT_TYPES.GIFT_CARD,
  POS_PAYMENT_TYPES.STORE_CREDIT,
  POS_PAYMENT_TYPES.ONLINE,
  POS_PAYMENT_TYPES.MIXED,
]);

export const posSearchSchema = z.object({
  query: z.string().trim().optional(),
  registerId: z.string().trim().optional(),
  shiftId: z.string().trim().optional(),
  status: posOrderStatusSchema.optional(),
  paymentType: posPaymentTypeSchema.optional(),
  employeeId: z.string().trim().optional(),
  tableId: z.string().trim().optional(),
  fromDate: z.string().trim().optional(),
  toDate: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.enum(["createdAt", "orderNumber", "totalCents", "status"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export const createPosSaleSchema = z.object({
  sessionId: z.string().trim().min(1),
  source: z
    .enum([
      POS_ORDER_SOURCES.DINE_IN,
      POS_ORDER_SOURCES.TAKEAWAY,
      POS_ORDER_SOURCES.DELIVERY,
      POS_ORDER_SOURCES.BAR,
      POS_ORDER_SOURCES.ONLINE,
      POS_ORDER_SOURCES.KIOSK,
    ])
    .optional(),
  tableId: z.string().trim().nullable().optional(),
  tableLabel: z.string().trim().nullable().optional(),
  reservationId: z.string().trim().nullable().optional(),
  customerId: z.string().trim().nullable().optional(),
  guestCount: z.coerce.number().int().min(1).nullable().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().trim().min(1),
        name: z.string().trim().min(1),
        quantity: z.coerce.number().int().min(1),
        unitPriceCents: z.coerce.number().int().min(0),
        modifiers: z.array(z.string()).optional(),
        notes: z.string().trim().nullable().optional(),
      }),
    )
    .min(1),
});

export const applyPosDiscountSchema = z.object({
  orderId: z.string().trim().min(1),
  discountType: z.enum([
    POS_DISCOUNT_TYPES.PERCENTAGE,
    POS_DISCOUNT_TYPES.FIXED,
    POS_DISCOUNT_TYPES.BOGO,
    POS_DISCOUNT_TYPES.PROMO_CODE,
    POS_DISCOUNT_TYPES.EMPLOYEE,
    POS_DISCOUNT_TYPES.LOYALTY,
  ]),
  label: z.string().trim().min(1),
  valueBps: z.coerce.number().int().min(0).max(10000).optional(),
  amountCents: z.coerce.number().int().min(0).optional(),
  promoCode: z.string().trim().optional(),
  appliedByEmployeeId: z.string().trim().min(1),
});

export const splitPosBillSchema = z.object({
  orderId: z.string().trim().min(1),
  splitCount: z.coerce.number().int().min(2).max(20),
  splitMethod: z.enum(["equal", "by_item", "by_amount", "by_guest"]).default("equal"),
});

export const processPosPaymentSchema = z.object({
  orderId: z.string().trim().min(1),
  paymentType: posPaymentTypeSchema,
  amountCents: z.coerce.number().int().min(1),
  tipCents: z.coerce.number().int().min(0).optional(),
  serviceChargeCents: z.coerce.number().int().min(0).optional(),
  reference: z.string().trim().optional(),
  processedByEmployeeId: z.string().trim().min(1),
  amountTenderedCents: z.coerce.number().int().min(0).optional(),
});

export const processPosRefundSchema = z.object({
  orderId: z.string().trim().min(1),
  paymentId: z.string().trim().min(1),
  reason: z.enum([
    POS_REFUND_REASONS.CUSTOMER_REQUEST,
    POS_REFUND_REASONS.WRONG_ORDER,
    POS_REFUND_REASONS.QUALITY_ISSUE,
    POS_REFUND_REASONS.OVERCHARGE,
    POS_REFUND_REASONS.FRAUD_SUSPECTED,
    POS_REFUND_REASONS.OTHER,
  ]),
  amountCents: z.coerce.number().int().min(1),
  processedByEmployeeId: z.string().trim().min(1),
});

export const mergePosBillsSchema = z.object({
  targetOrderId: z.string().trim().min(1),
  sourceOrderIds: z.array(z.string().trim().min(1)).min(1),
});

export const transferPosTableSchema = z.object({
  orderId: z.string().trim().min(1),
  fromTableId: z.string().trim().min(1),
  toTableId: z.string().trim().min(1),
  toTableLabel: z.string().trim().min(1),
});

export const voidPosOrderSchema = z.object({
  orderId: z.string().trim().min(1),
  reason: z.string().trim().max(500).optional(),
});

export const openPosShiftSchema = z.object({
  registerId: z.string().trim().min(1),
  openingCashCents: z.coerce.number().int().min(0).default(0),
});

export const closePosShiftSchema = z.object({
  shiftId: z.string().trim().min(1),
  closingCashCents: z.coerce.number().int().min(0),
});

export const cashDrawerActionSchema = z.object({
  drawerId: z.string().trim().min(1),
  amountCents: z.coerce.number().int().min(0).default(0),
  reason: z.string().trim().max(200).optional(),
});

export type ProcessPosRefundSchemaInput = z.infer<typeof processPosRefundSchema>;
export type PosSearchSchemaInput = z.infer<typeof posSearchSchema>;
export type CreatePosSaleSchemaInput = z.infer<typeof createPosSaleSchema>;
export type ApplyPosDiscountSchemaInput = z.infer<typeof applyPosDiscountSchema>;
export type SplitPosBillSchemaInput = z.infer<typeof splitPosBillSchema>;
export type ProcessPosPaymentSchemaInput = z.infer<typeof processPosPaymentSchema>;
export type CashDrawerActionSchemaInput = z.infer<typeof cashDrawerActionSchema>;
export type OpenPosShiftSchemaInput = z.infer<typeof openPosShiftSchema>;
export type ClosePosShiftSchemaInput = z.infer<typeof closePosShiftSchema>;
export type VoidPosOrderSchemaInput = z.infer<typeof voidPosOrderSchema>;
export type MergePosBillsSchemaInput = z.infer<typeof mergePosBillsSchema>;
export type TransferPosTableSchemaInput = z.infer<typeof transferPosTableSchema>;
