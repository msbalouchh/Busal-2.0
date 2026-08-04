export {
  POS_ORDER_STATUSES,
  POS_PAYMENT_TYPES,
  POS_DISCOUNT_TYPES,
  POS_SHIFT_STATUSES,
  POS_CASH_DRAWER_EVENT_TYPES,
  POS_RECEIPT_CHANNELS,
  POS_REFUND_REASONS,
  POS_ORDER_SOURCES,
  POS_AI_TOOL_IDS,
  POS_PERMISSIONS,
  POS_ORDER_STATUS_LABELS,
  POS_PAYMENT_TYPE_LABELS,
  POS_SHIFT_STATUS_LABELS,
  type PosOrderStatus,
  type PosPaymentType,
  type PosDiscountType,
  type PosShiftStatus,
  type PosCashDrawerEventType,
  type PosReceiptChannel,
  type PosRefundReason,
  type PosOrderSource,
  type PosAiToolId,
  type PosPermission,
} from "@/modules/pos/constants/pos-status";

export {
  POS_INTEGRATION_POINTS,
  type PosIntegrationPoint,
} from "@/modules/pos/constants/integration-points";

export {
  POS_PLATFORM_ROUTES,
  POS_PLATFORM_NAV_ITEMS,
} from "@/modules/pos/constants/platform-routes";

export {
  DEFAULT_POS_SCOPE,
  MOCK_POS_REGISTER,
  MOCK_POS_TERMINALS,
  MOCK_POS_SHIFT,
  MOCK_POS_EMPLOYEES,
  MOCK_POS_CASH_DRAWER,
  MOCK_POS_SESSION,
  MOCK_POS_RECORDS,
  MOCK_POS_REGISTERS,
  MOCK_POS_SHIFTS,
} from "@/modules/pos/constants/mock-data";

export type * from "@/modules/pos/types/pos-platform";

export * from "@/modules/pos/utils/pos-selectors";
export * from "@/modules/pos/utils/pos-discount-utils";
export * from "@/modules/pos/utils/pos-tax-utils";

export { PosRepository, posRepository } from "@/modules/pos/repository/pos-repository";

export { PosService, posService } from "@/modules/pos/services/pos.service";

export {
  buildPosPlatformContext,
  buildPosPlatformSnapshot,
  getDefaultPosSnapshot,
  getOpenPosOrders,
  getHeldPosOrders,
  type PosPlatformSnapshot,
  type PosPlatformInput,
} from "@/modules/pos/services/pos-platform.service";

export { PosProvider } from "@/modules/pos/providers/pos-provider";
export { PosContext } from "@/modules/pos/contexts/pos-context";

export { usePos, usePosContext } from "@/modules/pos/hooks/use-pos";
export { usePosCart } from "@/modules/pos/hooks/use-pos-cart";
export { usePosShift } from "@/modules/pos/hooks/use-pos-shift";

export { PosOrderStatusBadge } from "@/modules/pos/components/pos-order-status-badge";
export { PosPaymentBadge } from "@/modules/pos/components/pos-payment-badge";
export { PosShiftBadge } from "@/modules/pos/components/pos-shift-badge";

export {
  registerPosAiTools,
  POS_AI_TOOLS,
  buildPosAiContext,
  createSaleForAi,
  applyDiscountForAi,
  splitBillForAi,
  recommendUpsells,
  predictBusyHours,
  detectSuspiciousRefunds,
  suggestPromotions,
  forecastRevenue,
} from "@/modules/pos/ai";
