export {
  INVENTORY_STOCK_STATUSES,
  INVENTORY_LOCATION_TYPES,
  INVENTORY_UNIT_TYPES,
  INVENTORY_MOVEMENT_TYPES,
  PURCHASE_ORDER_STATUSES,
  GRN_STATUSES,
  STOCK_ADJUSTMENT_REASONS,
  WASTE_REASONS,
  INVENTORY_AI_TOOL_IDS,
  INVENTORY_PERMISSIONS,
  INVENTORY_STOCK_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_LABELS,
  type InventoryStockStatus,
  type InventoryLocationType,
  type InventoryUnitType,
  type InventoryMovementType,
  type PurchaseOrderStatus,
  type GrnStatus,
  type StockAdjustmentReason,
  type WasteReason,
  type InventoryAiToolId,
  type InventoryPermission,
} from "@/modules/inventory/constants/inventory-status";

export {
  INVENTORY_INTEGRATION_POINTS,
  type InventoryIntegrationPoint,
} from "@/modules/inventory/constants/integration-points";

export {
  INVENTORY_PLATFORM_ROUTES,
  INVENTORY_PLATFORM_NAV_ITEMS,
} from "@/modules/inventory/constants/platform-routes";

export { INVENTORY_MODULE_PERMISSIONS } from "@/modules/inventory/constants/permissions";

export type * from "@/modules/inventory/types/inventory-platform";

export * from "@/modules/inventory/utils/inventory-selectors";
export * from "@/modules/inventory/utils/inventory-stock-utils";
export * from "@/modules/inventory/utils/inventory-expiry-utils";

export {
  InventoryRepository,
  inventoryRepository,
} from "@/modules/inventory/repository/inventory-repository";

export { InventoryService, inventoryService } from "@/modules/inventory/services/inventory.service";

export {
  buildInventoryPlatformContext,
  buildInventoryPlatformSnapshot,
  getCriticalStockItems,
  type InventoryPlatformSnapshot,
  type InventoryPlatformInput,
} from "@/modules/inventory/services/inventory-platform.service";

export { InventoryProvider } from "@/modules/inventory/providers/inventory-provider";
export { InventoryContext } from "@/modules/inventory/contexts/inventory-context";

export { useInventory, useInventoryContext } from "@/modules/inventory/hooks/use-inventory";
export { useInventoryStock } from "@/modules/inventory/hooks/use-inventory-stock";
export { useInventoryPurchase } from "@/modules/inventory/hooks/use-inventory-purchase";

export { InventoryStockStatusBadge } from "@/modules/inventory/components/inventory-stock-status-badge";
export { PurchaseOrderStatusBadge } from "@/modules/inventory/components/purchase-order-status-badge";
export { InventoryLocationBadge } from "@/modules/inventory/components/inventory-location-badge";
export { InventoryManagementLoading } from "@/modules/inventory/components/inventory-management-loading";
export { InventoryManagementEmpty } from "@/modules/inventory/components/inventory-management-empty";
export { InventoryManagementError } from "@/modules/inventory/components/inventory-management-error";
export { InventoryOverview } from "@/modules/inventory/components/inventory-overview";

export {
  registerInventoryAiTools,
  INVENTORY_AI_TOOLS,
  buildInventoryAiContext,
  createInventoryItemForAi,
  updateStockForAi,
  predictLowStock,
  forecastDemand,
  recommendPurchaseOrders,
  detectInventoryWaste,
  suggestReorderQuantity,
  optimizeStockLevels,
  predictExpiryRisk,
} from "@/modules/inventory/ai";
