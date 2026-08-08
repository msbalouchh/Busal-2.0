/** @deprecated Import from `@/modules/payments/services/payment-business-bridge.service` */
export {
  getOrderPaymentSummaryForBusiness as getOrderPaymentSummary,
  recordPaymentForBusiness as recordPayment,
  voidPaymentForBusiness as voidPayment,
  refundPaymentForBusiness as refundPaymentPlaceholder,
  listUnpaidOrdersForBusiness as listUnpaidOrders,
  getPaymentOrderContextForBusiness as getPaymentOrderContext,
  listOrderPayments as listPaymentsForOrder,
} from "@/modules/payments/services/payment-business-bridge.service";

export type { OrderPaymentSummary } from "@/modules/payments/services/payment-business-bridge.service";
export {
  createIdempotencyReference,
  getOrderPayment,
  getPaymentDashboardStats,
  recordSplitOrderPayments,
} from "@/modules/payments/services/payment-business-bridge.service";
