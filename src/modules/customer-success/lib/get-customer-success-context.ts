import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeCustomer360Profile,
  serializeCustomerSuccessDashboard,
  serializeSuccessPlaybook,
} from "@/modules/customer-success/utils/customer-success-utils";
import {
  getCustomerSuccessDashboard,
  listCustomer360Profiles,
  listCustomerFeedback,
  listCustomerRenewals,
  listCustomerSuccessTasks,
  listExecutiveReviews,
  listExpansionOpportunities,
  listSuccessPlaybooks,
} from "@/services/customer-success.service";

export const getCustomerSuccessOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SUCCESS_VIEW });
  const dashboard = await getCustomerSuccessDashboard(context.business.id);

  return {
    context,
    dashboard: serializeCustomerSuccessDashboard(dashboard),
  };
});

export const getCustomer360ProfilesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SUCCESS_VIEW });
  const profiles = await listCustomer360Profiles(context.business.id);

  return {
    context,
    profiles: profiles.map(serializeCustomer360Profile),
  };
});

export const getCustomerHealthContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SUCCESS_VIEW });
  const profiles = await listCustomer360Profiles(context.business.id);

  return {
    context,
    profiles: profiles.map(serializeCustomer360Profile),
  };
});

export const getCustomerSuccessTasksContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SUCCESS_VIEW });
  const tasks = await listCustomerSuccessTasks(context.business.id);

  return { context, tasks };
});

export const getSuccessPlaybooksContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SUCCESS_VIEW });
  const playbooks = await listSuccessPlaybooks(context.business.id);

  return {
    context,
    playbooks: playbooks.map(serializeSuccessPlaybook),
  };
});

export const getCustomerFeedbackContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SUCCESS_VIEW });
  const feedback = await listCustomerFeedback(context.business.id);

  return { context, feedback };
});

export const getCustomerRenewalsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SUCCESS_VIEW });
  const renewals = await listCustomerRenewals(context.business.id);

  return { context, renewals };
});

export const getExpansionOpportunitiesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SUCCESS_VIEW });
  const expansions = await listExpansionOpportunities(context.business.id);

  return { context, expansions };
});

export const getExecutiveReviewsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SUCCESS_VIEW });
  const reviews = await listExecutiveReviews(context.business.id);

  return { context, reviews };
});
