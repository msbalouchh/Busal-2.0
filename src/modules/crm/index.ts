export * from "@/modules/crm/constants/routes";
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
  type CrmIntegrationPoint,
} from "@/modules/crm/constants/integration-points";
export {
  DEFAULT_CRM_SCOPE,
  MOCK_CRM_TAGS,
  MOCK_CRM_SEGMENTS,
  MOCK_CUSTOMER_RECORDS,
} from "@/modules/crm/constants/mock-data";

export * from "@/modules/crm/lib/get-crm-context";
export * from "@/modules/crm/types/crm";
export type * from "@/modules/crm/types/customer";
export * from "@/modules/crm/utils/crm-utils";
export * from "@/modules/crm/utils/customer-selectors";

export {
  CustomerRepository,
  customerRepository,
} from "@/modules/crm/repository/customer-repository";

export { CustomerService, customerService } from "@/modules/crm/services/customer.service";
export {
  buildCrmPlatformContext,
  buildCrmPlatformSnapshot,
  getDefaultCrmSnapshot,
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
} from "@/modules/crm/ai";

// Existing UI exports
export { CrmNav } from "@/modules/crm/components/crm-nav";
export { CrmDashboard } from "@/modules/crm/components/crm-dashboard";
export { CustomersManager } from "@/modules/crm/components/customers-manager";
export { CustomerDetailPanel } from "@/modules/crm/components/customer-detail-view";
