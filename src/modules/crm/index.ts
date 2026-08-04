export * from "@/modules/crm/constants/routes";
export { CRM_PERMISSIONS, type CrmPermissionCode } from "@/modules/crm/constants/permissions";
export {
  CUSTOMER_STATUSES,
  TIMELINE_EVENT_TYPES,
  COMMUNICATION_CHANNELS,
  MEMBERSHIP_TIERS,
  CRM_AI_TOOL_IDS,
  type CustomerStatus,
  type TimelineEventType,
  type CommunicationChannel,
  type MembershipTier,
  type CrmAiToolId,
} from "@/modules/crm/constants/customer-status";
export {
  CRM_INTEGRATION_POINTS,
  CRM_INTEGRATION_STATUS,
  type CrmIntegrationPoint,
} from "@/modules/crm/constants/integration-points";

export * from "@/modules/crm/lib/get-crm-context";
export * from "@/modules/crm/lib/crm-scope";
export * from "@/modules/crm/types/crm";
export type * from "@/modules/crm/types/customer";
export * from "@/modules/crm/utils/crm-utils";
export * from "@/modules/crm/utils/customer-selectors";
export * from "@/modules/crm/validation/customer-schemas";

export {
  CustomerRepository,
  customerRepository,
  type CustomerSearchResult,
  type CustomerImportResult,
  type CustomerExportRow,
} from "@/modules/crm/repository/customer-repository";

export { CustomerService, customerService } from "@/modules/crm/services/customer.service";
export {
  buildCrmPlatformContext,
  buildCrmPlatformSnapshot,
  getDefaultCrmSnapshot,
  getCrmDashboardForContext,
  type CrmPlatformSnapshot,
  type CrmPlatformInput,
} from "@/modules/crm/services/crm-platform.service";

export { CrmProvider } from "@/modules/crm/providers/crm-provider";
export { CrmContext } from "@/modules/crm/contexts/crm-context";

export { useCrm, useCrmContext } from "@/modules/crm/hooks/use-crm";
export { useCustomer } from "@/modules/crm/hooks/use-customer";
export { useCustomerSearch } from "@/modules/crm/hooks/use-customer-search";

export { CustomerBadge } from "@/modules/crm/components/customer-badge";
export { CustomerTimelinePanel } from "@/modules/crm/components/customer-timeline-panel";

export {
  registerCrmAiTools,
  CRM_AI_TOOLS,
  buildCustomerAiContext,
  generateMarketingRecommendations,
  buildCustomerHistorySummary,
  searchCustomersForAi,
  generateCustomerAiInsights,
  type CustomerAiInsights,
} from "@/modules/crm/ai";

export * from "@/modules/crm/actions/crm-actions";

// UI exports
export { CrmNav } from "@/modules/crm/components/crm-nav";
export { CrmDashboard } from "@/modules/crm/components/crm-dashboard";
export { CustomersManager } from "@/modules/crm/components/customers-manager";
export { CustomerDetailPanel } from "@/modules/crm/components/customer-detail-view";
