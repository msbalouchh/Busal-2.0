"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterAction } from "@/modules/control-center/guards/control-center.guards";
import { CONTROL_CENTER_AI_USAGE_ROUTES } from "@/modules/control-center/ai-usage/constants/control-center-ai-usage";
import type { ControlCenterAiUsageQuery } from "@/modules/control-center/ai-usage/types/control-center-ai-usage-types";
import {
  exportControlCenterAiUsage,
  getControlCenterAiUsageBundle,
} from "@/services/control-center-ai-usage.service";

function revalidateAiUsagePage() {
  revalidatePath(CONTROL_CENTER_AI_USAGE_ROUTES.hub);
}

export async function refreshControlCenterAiUsageAction(query: ControlCenterAiUsageQuery = {}) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_AI, async ({ operator }) =>
    getControlCenterAiUsageBundle(operator, query),
  );
}

export async function exportControlCenterAiUsageAction(
  query: ControlCenterAiUsageQuery = {},
  format: "csv" | "json" = "json",
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_AI, async ({ operator }) =>
    exportControlCenterAiUsage(operator, query, format),
  );
}

export async function queryControlCenterAiUsageSectionAction(query: ControlCenterAiUsageQuery) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_AI, async ({ operator }) => {
    const bundle = await getControlCenterAiUsageBundle(operator, query);
    revalidateAiUsagePage();
    return bundle;
  });
}
