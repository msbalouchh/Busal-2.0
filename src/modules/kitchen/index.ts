export {
  KITCHEN_STATUSES,
  KITCHEN_STATION_TYPES,
  KITCHEN_PRIORITIES,
  KITCHEN_TIMELINE_EVENT_TYPES,
  KITCHEN_SCREEN_MODES,
  KITCHEN_QUEUE_SORT_STRATEGIES,
  KITCHEN_AI_TOOL_IDS,
  KITCHEN_PERMISSIONS,
  KITCHEN_STATUS_LABELS,
  KITCHEN_STATION_LABELS,
  KITCHEN_PRIORITY_LABELS,
  type KitchenStatus,
  type KitchenStationType,
  type KitchenPriority,
  type KitchenTimelineEventType,
  type KitchenScreenMode,
  type KitchenQueueSortStrategy,
  type KitchenAiToolId,
  type KitchenPermission,
} from "@/modules/kitchen/constants/kitchen-status";

export { KITCHEN_MODULE_PERMISSIONS } from "@/modules/kitchen/constants/permissions";

export {
  KITCHEN_INTEGRATION_POINTS,
  type KitchenIntegrationPoint,
} from "@/modules/kitchen/constants/integration-points";

export {
  KITCHEN_PLATFORM_ROUTES,
  KITCHEN_PLATFORM_NAV_ITEMS,
} from "@/modules/kitchen/constants/platform-routes";

export type * from "@/modules/kitchen/types/kitchen";

export * from "@/modules/kitchen/utils/kitchen-selectors";
export * from "@/modules/kitchen/utils/kitchen-queue-utils";
export * from "@/modules/kitchen/utils/kitchen-timer-utils";

export { KitchenProvider } from "@/modules/kitchen/providers/kitchen-provider";
export { KitchenContext } from "@/modules/kitchen/contexts/kitchen-context";

export { useKitchen, useKitchenContext } from "@/modules/kitchen/hooks/use-kitchen";
export { useKitchenQueue } from "@/modules/kitchen/hooks/use-kitchen-queue";
export { useKitchenStation } from "@/modules/kitchen/hooks/use-kitchen-station";

export { KitchenStatusBadge } from "@/modules/kitchen/components/kitchen-status-badge";
export { KitchenStationBadge } from "@/modules/kitchen/components/kitchen-station-badge";
export { KitchenPriorityBadge } from "@/modules/kitchen/components/kitchen-priority-badge";
export { KitchenDisplayManager } from "@/modules/kitchen/components/kitchen-display-manager";
export { KitchenOverview } from "@/modules/kitchen/components/kitchen-overview";
export { KitchenManagementLoading } from "@/modules/kitchen/components/kitchen-management-loading";
export { KitchenManagementEmpty } from "@/modules/kitchen/components/kitchen-management-empty";
export { KitchenManagementError } from "@/modules/kitchen/components/kitchen-management-error";

export {
  registerKitchenAiTools,
  KITCHEN_AI_TOOLS,
  buildKitchenAiContext,
  routeOrderToStation,
  assignStationForTicket,
  predictKitchenDelays,
  optimizeKitchenQueue,
  estimatePreparationTime,
  recommendWorkflowImprovements,
  detectKitchenBottlenecks,
  forecastKitchenLoad,
  suggestStaffAllocation,
  recommendStationBalancing,
} from "@/modules/kitchen/ai";

export { getKitchenDisplayContext } from "@/modules/kitchen/lib/get-kitchen-display-context";
export { getKitchenModuleContext } from "@/modules/kitchen/lib/get-kitchen-module-context";

export { buildKitchenPlatformContext } from "@/modules/kitchen/lib/kitchen-platform-context";
