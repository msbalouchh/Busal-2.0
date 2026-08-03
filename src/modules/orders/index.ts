export {
  ORDER_STATUSES,
  ORDER_TYPES,
  ORDER_SOURCES,
  ORDER_TIMELINE_EVENT_TYPES,
  FULFILLMENT_STATUSES,
  PAYMENT_STATUSES,
  ORDER_AI_TOOL_IDS,
  ORDER_STATUS_TRANSITIONS,
  type OrderStatus,
  type OrderType,
  type OrderSource,
  type OrderTimelineEventType,
  type FulfillmentStatus,
  type PaymentStatus,
  type OrderAiToolId,
} from "@/modules/orders/constants/order-status";

export {
  OMS_INTEGRATION_POINTS,
  type OmsIntegrationPoint,
} from "@/modules/orders/constants/integration-points";

export { DEFAULT_OMS_SCOPE, MOCK_ORDER_RECORDS } from "@/modules/orders/constants/mock-data";

export type * from "@/modules/orders/types/order";
export * from "@/modules/orders/utils/order-selectors";

export { OrderRepository, orderRepository } from "@/modules/orders/repository/order-repository";

export { OrderService, orderService } from "@/modules/orders/services/order.service";
export {
  buildOmsPlatformContext,
  buildOmsPlatformSnapshot,
  getDefaultOmsSnapshot,
  type OmsPlatformSnapshot,
  type OmsPlatformInput,
} from "@/modules/orders/services/oms-platform.service";

export { OrdersProvider } from "@/modules/orders/providers/orders-provider";
export { OrdersContext } from "@/modules/orders/contexts/orders-context";

export { useOrders, useOrdersContext } from "@/modules/orders/hooks/use-orders";
export { useOrder } from "@/modules/orders/hooks/use-order";
export { useOrderSearch } from "@/modules/orders/hooks/use-order-search";

export { OrderStatusBadge } from "@/modules/orders/components/order-status-badge";
export { OrderTimelinePanel } from "@/modules/orders/components/order-timeline-panel";

export {
  registerOrderAiTools,
  ORDER_AI_TOOLS,
  buildOrderAiContext,
  generateUpsellRecommendations,
  predictOrderDelay,
  buildOrderTrackingSummary,
  searchOrdersForAi,
} from "@/modules/orders/ai";
