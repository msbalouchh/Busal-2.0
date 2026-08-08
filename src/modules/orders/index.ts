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

export {
  ORDER_MODULE_PERMISSIONS,
  type OrderModulePermissionCode,
} from "@/modules/orders/constants/permissions";

export type * from "@/modules/orders/types/order";
export * from "@/modules/orders/utils/order-selectors";

export {
  OrderRepository,
  orderRepository,
  type OrderSearchResult,
} from "@/modules/orders/repository/order-repository";

export { OrderService, orderService } from "@/modules/orders/services/order.service";

export {
  buildOmsPlatformSnapshot,
  type OmsPlatformSnapshot,
} from "@/modules/orders/services/oms-platform.service";

export {
  buildOmsPlatformContext,
  type OmsPlatformInput,
} from "@/modules/orders/lib/oms-platform-context";

export {
  getOrderModuleContext,
  getOrderSnapshot,
  type OrderModulePageContext,
} from "@/modules/orders/lib/get-order-context";

export * from "@/modules/orders/lib/order-scope";

export {
  createOrderAction,
  modifyOrderAction,
  cancelOrderAction,
  refundOrderAction,
  assignOrderTableAction,
  assignOrderCustomerAction,
  transferOrderAction,
  mergeOrdersAction,
  splitOrderAction,
  bulkUpdateOrdersAction,
  archiveOrderAction,
  restoreOrderAction,
} from "@/modules/orders/actions/order-actions";

export { OrdersProvider } from "@/modules/orders/providers/orders-provider";
export { OrdersContext } from "@/modules/orders/contexts/orders-context";

export { useOrders, useOrdersContext } from "@/modules/orders/hooks/use-orders";
export { useOrder } from "@/modules/orders/hooks/use-order";
export { useOrderSearch } from "@/modules/orders/hooks/use-order-search";

export { OrderStatusBadge } from "@/modules/orders/components/order-status-badge";
export { OrderTimelinePanel } from "@/modules/orders/components/order-timeline-panel";
export { OrderManagementOverview } from "@/modules/orders/components/order-management-overview";
export { OrderManagementLoading } from "@/modules/orders/components/order-management-loading";
export { OrderManagementEmpty } from "@/modules/orders/components/order-management-empty";
export { OrderManagementError } from "@/modules/orders/components/order-management-error";

export {
  registerOrderAiTools,
  ORDER_AI_TOOLS,
  buildOrderAiContext,
  generateUpsellRecommendations,
  predictOrderDelay,
  predictPreparationTime,
  suggestOrderOptimizations,
  forecastDemand,
  detectDelays,
  detectHighValueCustomers,
  buildOrderTrackingSummary,
  searchOrdersForAi,
  buildOrderCatalogSummary,
} from "@/modules/orders/ai";
