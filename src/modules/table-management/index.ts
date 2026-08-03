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

export {
  DEFAULT_TABLE_SCOPE,
  MOCK_TABLE_RECORD,
  MOCK_TABLE_RECORDS,
  MOCK_FLOOR_RECORD,
  MOCK_FLOOR_RECORDS,
} from "@/modules/table-management/constants/mock-data";

export type * from "@/modules/table-management/types/table-management";
export * from "@/modules/table-management/utils/table-selectors";
export * from "@/modules/table-management/utils/table-layout-utils";

export {
  TableManagementRepository,
  tableManagementRepository,
} from "@/modules/table-management/repository/table-management-repository";

export {
  TableManagementService,
  tableManagementService,
} from "@/modules/table-management/services/table-management.service";

export {
  buildTablePlatformContext,
  buildTablePlatformSnapshot,
  getDefaultTableSnapshot,
  getHighUtilizationTables,
  type TablePlatformSnapshot,
  type TablePlatformInput,
} from "@/modules/table-management/services/table-platform.service";

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

export {
  registerTableManagementAiTools,
  TABLE_MANAGEMENT_AI_TOOLS,
  buildTableAiContext,
  recommendTableForParty,
  predictWaitTime,
  optimizeSeatingLayout,
  searchTablesForAi,
  buildFloorSummary,
} from "@/modules/table-management/ai";
