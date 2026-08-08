export {
  TABLE_STATUSES,
  ZONE_TYPES,
  TABLE_KINDS,
  TABLE_RESERVATION_STATES,
  TABLE_TIMELINE_EVENT_TYPES,
  TABLE_AI_TOOL_IDS,
  TABLE_MANAGEMENT_PERMISSIONS,
  type TableStatus,
  type ZoneType,
  type TableKind,
  type TableReservationStateKind,
  type TableTimelineEventType,
  type TableAiToolId,
  type TableManagementPermission,
} from "@/modules/table-management/constants/table-status";

export {
  TABLE_MANAGEMENT_INTEGRATION_POINTS,
  type TableManagementIntegrationPoint,
} from "@/modules/table-management/constants/integration-points";

export {
  TABLE_MANAGEMENT_ROUTES,
  TABLE_MANAGEMENT_NAV_ITEMS,
} from "@/modules/table-management/constants/routes";

export { TABLE_PERMISSIONS, type TablePermissionCode } from "@/modules/table-management/constants/permissions";

export type * from "@/modules/table-management/types/table-management";
export * from "@/modules/table-management/utils/table-selectors";
export * from "@/modules/table-management/utils/table-layout-utils";

export {
  TableManagementRepository,
  tableManagementRepository,
  type TableSearchResult,
} from "@/modules/table-management/repository/table-management-repository";

export {
  TableManagementService,
  tableManagementService,
} from "@/modules/table-management/services/table-management.service";

export {
  buildTablePlatformSnapshot,
  getHighUtilizationTables,
} from "@/modules/table-management/services/table-platform.service";

export {
  buildTablePlatformContext,
  type TablePlatformInput,
} from "@/modules/table-management/lib/table-platform-context";

export { getTableManagementContext, getTableManagementSnapshot } from "@/modules/table-management/lib/get-table-management-context";
export * from "@/modules/table-management/lib/table-scope";

export {
  createFloorAction,
  updateFloorAction,
  createTableAction,
  updateTableAction,
  archiveTableAction,
  restoreTableAction,
  bulkUpdateTablesAction,
  mergeTablesAction,
  splitTablesAction,
  assignTableAction,
  transferTableAction,
} from "@/modules/table-management/actions/table-management-actions";

export { TableManagementProvider } from "@/modules/table-management/providers/table-management-provider";
export { TableManagementContext } from "@/modules/table-management/contexts/table-management-context";

export {
  useTableManagement,
  useTableManagementContext,
} from "@/modules/table-management/hooks/use-table-management";
export { useTable } from "@/modules/table-management/hooks/use-table";
export { useTableFloor } from "@/modules/table-management/hooks/use-table-floor";

export { TableStatusBadge } from "@/modules/table-management/components/table-status-badge";
export { TableZoneBadge } from "@/modules/table-management/components/table-zone-badge";
export { TableManagementOverview } from "@/modules/table-management/components/table-management-overview";
export { TableManagementLoading } from "@/modules/table-management/components/table-management-loading";
export { TableManagementEmpty } from "@/modules/table-management/components/table-management-empty";
export { TableManagementError } from "@/modules/table-management/components/table-management-error";

export {
  registerTableManagementAiTools,
  TABLE_MANAGEMENT_AI_TOOLS,
  buildTableAiContext,
  recommendTableForParty,
  predictWaitTime,
  optimizeSeatingLayout,
  detectIdleTables,
  recommendMergeOrSplit,
  searchTablesForAi,
  buildFloorSummary,
} from "@/modules/table-management/ai";
