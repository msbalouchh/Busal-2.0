import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  formatCrmMoney,
  serializeCrmDashboard,
  serializeCustomer,
  serializeCustomerDetail,
} from "@/modules/crm/utils/crm-utils";
import {
  getCrmDashboard,
  getCustomer,
  getCustomerOrderHistory,
  getCustomerTimeline,
  listCustomerGroups,
  listCustomerNotes,
  listCustomers,
} from "@/services/crm.service";
import {
  getOrCreateLoyaltyProgram,
  listPointTransactions,
  listRewards,
} from "@/services/loyalty.service";

export const getCrmOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.CRM_VIEW });
  const dashboard = await getCrmDashboard(context.business.id, context.branchId);

  return { context, dashboard: serializeCrmDashboard(dashboard) };
});

export const getCrmCustomersContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.CRM_VIEW });
  const [customers, groups] = await Promise.all([
    listCustomers(context.business.id),
    listCustomerGroups(context.business.id),
  ]);

  return {
    context,
    customers: customers.map(serializeCustomer),
    groups,
  };
});

export const getCrmCustomerDetailContext = cache(async (customerId: string) => {
  const context = await protectedPage({ permission: PERMISSION_CODES.CRM_VIEW });
  const [customer, history, timeline, notes, pointTransactions, rewards] = await Promise.all([
    getCustomer(customerId, context.business.id),
    getCustomerOrderHistory(customerId, context.business.id, context.branchId),
    getCustomerTimeline(customerId, context.business.id),
    listCustomerNotes(customerId, context.business.id),
    listPointTransactions(customerId, context.business.id),
    listRewards(context.business.id),
  ]);

  return {
    context,
    customer: serializeCustomerDetail(customer),
    history: {
      ...history,
      totalSpentFormatted: formatCrmMoney(history.totalSpentPence),
      averageOrderValueFormatted: formatCrmMoney(history.averageOrderValuePence),
    },
    timeline: timeline.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      title: event.title,
      description: event.description,
      createdAt: event.createdAt.toISOString(),
    })),
    notes: notes.map((note) => ({
      id: note.id,
      content: note.content,
      authorName: note.authorName,
      createdAt: note.createdAt.toISOString(),
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
  };
});

export const getCrmLoyaltyContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.CRM_VIEW });
  const program = await getOrCreateLoyaltyProgram(context.business.id);

  return { context, program };
});

export const getCrmRewardsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.CRM_VIEW });
  const rewards = await listRewards(context.business.id);

  return { context, rewards };
});

export const getCrmGroupsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.CRM_VIEW });
  const groups = await listCustomerGroups(context.business.id);

  return { context, groups };
});
