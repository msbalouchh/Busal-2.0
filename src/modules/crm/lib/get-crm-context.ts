import { cache } from "react";

import { CRM_PERMISSIONS } from "@/modules/crm/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import { resolveCrmScope, toCrmPlatformContext } from "@/modules/crm/lib/crm-scope";
import { customerRepository } from "@/modules/crm/repository/customer-repository";
import { customerService } from "@/modules/crm/services/customer.service";
import {
  formatCrmMoney,
  serializeCrmDashboard,
  serializeCustomerRecord,
  serializeCustomerRecordDetail,
} from "@/modules/crm/utils/crm-utils";
import {
  getOrCreateLoyaltyProgram,
  listPointTransactions,
  listRewards,
} from "@/services/loyalty.service";

export const getCrmOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: CRM_PERMISSIONS.CRM_READ });
  const scope = resolveCrmScope(context);
  const dashboard = await customerRepository.getDashboard(scope, context.branchId);

  return { context, dashboard: serializeCrmDashboard(dashboard) };
});

export const getCrmCustomersContext = cache(async () => {
  const context = await protectedPage({ permission: CRM_PERMISSIONS.CRM_READ });
  const scope = resolveCrmScope(context);
  const platformContext = toCrmPlatformContext(scope);
  const [searchResult, segments] = await Promise.all([
    customerService.search({ pageSize: 200 }, platformContext),
    customerRepository.getSegments(scope),
  ]);

  return {
    context,
    customers: searchResult.records.map(serializeCustomerRecord),
    groups: segments.map((segment) => ({ id: segment.id, name: segment.name })),
  };
});

export const getCrmCustomerDetailContext = cache(async (customerId: string) => {
  const context = await protectedPage({ permission: CRM_PERMISSIONS.CRM_READ });
  const scope = resolveCrmScope(context);
  const platformContext = toCrmPlatformContext(scope);
  const record = await customerService.getById(customerId, platformContext);

  if (!record) {
    throw new Error("Customer not found");
  }

  const [pointTransactions, rewards] = await Promise.all([
    listPointTransactions(customerId, context.business.id),
    listRewards(context.business.id),
  ]);

  return {
    context,
    customer: serializeCustomerRecordDetail(record),
    history: {
      totalOrders: record.analytics.totalOrders,
      totalSpentPence: record.analytics.totalSpentPence,
      averageOrderValuePence: record.analytics.averageOrderValuePence,
      lastOrderAt: record.analytics.lastOrderAt,
      favouriteItems: [],
      totalSpentFormatted: formatCrmMoney(record.analytics.totalSpentPence),
      averageOrderValueFormatted: formatCrmMoney(record.analytics.averageOrderValuePence),
    },
    timeline: record.timeline.map((event) => ({
      id: event.id,
      eventType: event.type.toUpperCase(),
      title: event.title,
      description: event.description,
      createdAt: event.occurredAt,
    })),
    notes: record.notes.map((note) => ({
      id: note.id,
      content: note.content,
      authorName: null,
      createdAt: note.createdAt,
    })),
    pointTransactions: pointTransactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      pointsChange: transaction.pointsChange,
      balanceAfter: transaction.balanceAfter,
      reason: transaction.reason,
      createdAt: transaction.createdAt.toISOString(),
    })),
    rewards,
    aiInsights: record.aiContext,
  };
});

export const getCrmLoyaltyContext = cache(async () => {
  const context = await protectedPage({ permission: CRM_PERMISSIONS.CRM_READ });
  const program = await getOrCreateLoyaltyProgram(context.business.id);

  return { context, program };
});

export const getCrmRewardsContext = cache(async () => {
  const context = await protectedPage({ permission: CRM_PERMISSIONS.CRM_READ });
  const rewards = await listRewards(context.business.id);

  return { context, rewards };
});

export const getCrmGroupsContext = cache(async () => {
  const context = await protectedPage({ permission: CRM_PERMISSIONS.CRM_READ });
  const scope = resolveCrmScope(context);
  const groups = await customerRepository.getSegments(scope);

  return { context, groups };
});

export const getCrmPlatformSnapshotContext = cache(async () => {
  const context = await protectedPage({ permission: CRM_PERMISSIONS.CRM_READ });
  const scope = resolveCrmScope(context);
  const platformContext = toCrmPlatformContext(scope);
  const [searchResult, segments, tags] = await Promise.all([
    customerService.search({ pageSize: 100 }, platformContext),
    customerRepository.getSegments(scope),
    customerRepository.getTags(scope),
  ]);

  return {
    context: platformContext,
    customers: searchResult.records,
    segments,
    tags,
    totalCustomers: searchResult.total,
    vipCount: searchResult.records.filter((record) => record.customer.status === "vip").length,
    atRiskCount: searchResult.records.filter((record) => record.analytics.churnRiskScore > 0.4)
      .length,
  };
});
