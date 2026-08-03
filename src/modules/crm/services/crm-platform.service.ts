import {
  DEFAULT_CRM_SCOPE,
  type MOCK_CRM_SEGMENTS,
  type MOCK_CRM_TAGS,
} from "@/modules/crm/constants/mock-data";
import { customerRepository } from "@/modules/crm/repository/customer-repository";
import type { CrmPlatformContext, CustomerRecord } from "@/modules/crm/types/customer";

export interface CrmPlatformSnapshot {
  context: CrmPlatformContext;
  customers: CustomerRecord[];
  segments: typeof MOCK_CRM_SEGMENTS;
  tags: typeof MOCK_CRM_TAGS;
  totalCustomers: number;
  vipCount: number;
  atRiskCount: number;
}

export interface CrmPlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId?: string;
  branchId?: string | null;
  userId?: string;
}

export function buildCrmPlatformContext(input: CrmPlatformInput = {}): CrmPlatformContext {
  return {
    tenantId: input.tenantId ?? DEFAULT_CRM_SCOPE.tenantId,
    workspaceId: input.workspaceId ?? DEFAULT_CRM_SCOPE.workspaceId,
    businessId: input.businessId ?? DEFAULT_CRM_SCOPE.businessId,
    branchId: input.branchId ?? DEFAULT_CRM_SCOPE.branchId,
    userId: input.userId ?? DEFAULT_CRM_SCOPE.userId,
  };
}

export function buildCrmPlatformSnapshot(input: CrmPlatformInput = {}): CrmPlatformSnapshot {
  const context = buildCrmPlatformContext(input);
  const customers = customerRepository.search({
    tenantId: context.tenantId,
    businessId: context.businessId,
  });

  return {
    context,
    customers,
    segments: customerRepository.getSegments(context.businessId),
    tags: customerRepository.getTags(),
    totalCustomers: customers.length,
    vipCount: customers.filter((record) => record.customer.status === "vip").length,
    atRiskCount: customers.filter((record) => record.analytics.churnRiskScore > 0.4).length,
  };
}

export function getDefaultCrmSnapshot(): CrmPlatformSnapshot {
  return buildCrmPlatformSnapshot();
}
