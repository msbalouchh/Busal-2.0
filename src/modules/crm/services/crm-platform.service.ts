import "server-only";

import {
  buildCrmScopeFromInput,
  toCrmPlatformContext,
  type CrmTenantScope,
} from "@/modules/crm/lib/crm-scope";
import { customerRepository } from "@/modules/crm/repository/customer-repository";
import { customerService } from "@/modules/crm/services/customer.service";
import type {
  CrmPlatformContext,
  CustomerRecord,
  CustomerSegment,
  CustomerTag,
} from "@/modules/crm/types/customer";

export interface CrmPlatformSnapshot {
  context: CrmPlatformContext;
  customers: CustomerRecord[];
  segments: CustomerSegment[];
  tags: CustomerTag[];
  totalCustomers: number;
  vipCount: number;
  atRiskCount: number;
}

export interface CrmPlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId: string;
  branchId?: string | null;
  userId?: string;
}

export function buildCrmPlatformContext(input: CrmPlatformInput): CrmPlatformContext {
  return toCrmPlatformContext(buildCrmScopeFromInput(input));
}

export async function buildCrmPlatformSnapshot(
  input: CrmPlatformInput,
): Promise<CrmPlatformSnapshot> {
  const context = buildCrmPlatformContext(input);
  const scope: CrmTenantScope = buildCrmScopeFromInput(input);
  const searchResult = await customerRepository.search(scope, { pageSize: 100 });
  const customers = searchResult.records;
  const [segments, tags] = await Promise.all([
    customerRepository.getSegments(scope),
    customerRepository.getTags(scope),
  ]);

  return {
    context,
    customers,
    segments,
    tags,
    totalCustomers: searchResult.total,
    vipCount: customers.filter((record) => record.customer.status === "vip").length,
    atRiskCount: customers.filter((record) => record.analytics.churnRiskScore > 0.4).length,
  };
}

export async function getDefaultCrmSnapshot(businessId: string): Promise<CrmPlatformSnapshot> {
  return buildCrmPlatformSnapshot({ businessId });
}

export async function getCrmDashboardForContext(context: CrmPlatformContext) {
  return customerService.getDashboard(context);
}
