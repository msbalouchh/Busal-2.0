import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeSearchAuditLog,
  serializeSearchIndexJob,
  serializeSearchIndexRecord,
  serializeSearchPlatformDashboard,
  serializeSearchQueryLog,
  serializeSearchSuggestion,
} from "@/modules/search-platform/utils/search-utils";
import {
  ensureSearchPlatformDefaults,
  getSearchPlatformDashboard,
  listSearchAuditLogs,
  listSearchEntityRegistrations,
  listSearchIndexJobs,
  listSearchIndexRecords,
  listSearchQueryLogs,
  listSearchSuggestions,
} from "@/services/search-platform.service";

export const getSearchPlatformOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SEARCH_VIEW });
  await ensureSearchPlatformDefaults(context.business.id);
  const dashboard = await getSearchPlatformDashboard(context.business.id);

  return {
    context,
    dashboard: serializeSearchPlatformDashboard(dashboard),
  };
});

export const getSearchPlatformIndexContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SEARCH_VIEW });
  const records = await listSearchIndexRecords(context.business.id);

  return {
    context,
    records: records.map(serializeSearchIndexRecord),
  };
});

export const getSearchPlatformQueriesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SEARCH_VIEW });
  const queries = await listSearchQueryLogs(context.business.id);

  return {
    context,
    queries: queries.map(serializeSearchQueryLog),
  };
});

export const getSearchPlatformSuggestionsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SEARCH_VIEW });
  const suggestions = await listSearchSuggestions(context.business.id);

  return {
    context,
    suggestions: suggestions.map(serializeSearchSuggestion),
  };
});

export const getSearchPlatformIndexJobsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SEARCH_VIEW });
  const jobs = await listSearchIndexJobs(context.business.id);

  return {
    context,
    jobs: jobs.map(serializeSearchIndexJob),
  };
});

export const getSearchPlatformAuditContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SEARCH_VIEW });
  const auditLogs = await listSearchAuditLogs(context.business.id);

  return {
    context,
    auditLogs: auditLogs.map(serializeSearchAuditLog),
  };
});

export const getSearchPlatformRegistryContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SEARCH_VIEW });
  const registrations = await listSearchEntityRegistrations();

  return {
    context,
    registrations,
  };
});
