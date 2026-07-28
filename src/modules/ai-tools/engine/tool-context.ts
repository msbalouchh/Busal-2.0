import type { BusinessContext } from "@/modules/business-context/types/business-context";

import type { SelectedRecordRef, ToolContext } from "@/modules/ai-tools/types/tool-types";

function resolveLocale(business: BusinessContext["business"]): string {
  if (business.country) {
    return business.country.toLowerCase() === "us" ? "en-US" : "en-GB";
  }
  return "en-GB";
}

export function buildToolContext(
  platform: BusinessContext,
  options: {
    currentModule?: string | null;
    selectedRecord?: SelectedRecordRef | null;
  } = {},
): ToolContext {
  return {
    business: platform.business,
    branch: platform.branch,
    branchId: platform.branchId,
    user: platform.user,
    roleSlug: platform.roleSlug,
    permissions: platform.permissions,
    currentModule: options.currentModule ?? null,
    selectedRecord: options.selectedRecord ?? null,
    locale: resolveLocale(platform.business),
    timezone: platform.business.timezone ?? "UTC",
  };
}
