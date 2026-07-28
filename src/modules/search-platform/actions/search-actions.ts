"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { SEARCH_PLATFORM_ROUTES } from "@/modules/search-platform/constants/routes";
import type { GlobalSearchOptions } from "@/modules/search-platform/types/search-platform-types";
import {
  executeGlobalSearch,
  fullRebuildIndex,
  getSearchSuggestions,
  queueSearchIndexJob,
  recordSearchClick,
  recoverFailedIndexes,
  reindexEntity,
} from "@/services/search-platform.service";

export async function runGlobalSearchAction(options: GlobalSearchOptions) {
  return protectedAction(PERMISSION_CODES.SEARCH_QUERY, async ({ platform }) =>
    executeGlobalSearch(platform, options),
  );
}

export async function getSearchSuggestionsAction(prefix?: string) {
  return protectedAction(PERMISSION_CODES.SEARCH_QUERY, async ({ platform }) =>
    getSearchSuggestions(platform, prefix),
  );
}

export async function recordSearchClickAction(input: {
  queryLogId?: string;
  indexRecordId: string;
}) {
  return protectedAction(PERMISSION_CODES.SEARCH_QUERY, async ({ platform }) => {
    await recordSearchClick(platform, input);
    revalidatePath(SEARCH_PLATFORM_ROUTES.queries);
  });
}

export async function queueIndexJobAction(
  jobType: "INCREMENTAL" | "FULL_REBUILD" | "REINDEX_ENTITY",
) {
  return protectedAction(PERMISSION_CODES.SEARCH_MANAGE_INDEX, async ({ platform }) => {
    const job = await queueSearchIndexJob(platform, { jobType });
    revalidatePath(SEARCH_PLATFORM_ROUTES.indexJobs);
    return job;
  });
}

export async function fullRebuildIndexAction() {
  return protectedAction(PERMISSION_CODES.SEARCH_MANAGE_INDEX, async ({ platform }) => {
    const result = await fullRebuildIndex(platform);
    revalidatePath(SEARCH_PLATFORM_ROUTES.index);
    revalidatePath(SEARCH_PLATFORM_ROUTES.indexJobs);
    return result;
  });
}

export async function reindexEntityAction(
  entityType: Parameters<typeof reindexEntity>[1],
  entityId: string,
) {
  return protectedAction(PERMISSION_CODES.SEARCH_MANAGE_INDEX, async ({ platform }) => {
    const result = await reindexEntity(platform, entityType, entityId);
    revalidatePath(SEARCH_PLATFORM_ROUTES.index);
    return result;
  });
}

export async function recoverFailedIndexesAction() {
  return protectedAction(PERMISSION_CODES.SEARCH_MANAGE_INDEX, async ({ platform }) => {
    const result = await recoverFailedIndexes(platform);
    revalidatePath(SEARCH_PLATFORM_ROUTES.index);
    revalidatePath(SEARCH_PLATFORM_ROUTES.indexJobs);
    return result;
  });
}
