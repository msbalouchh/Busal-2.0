"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterAction } from "@/modules/control-center/guards/control-center.guards";
import { PLATFORM_INTELLIGENCE_ROUTES } from "@/modules/control-center/platform-intelligence/constants/platform-intelligence";
import type { PlatformIntelligenceQuery } from "@/modules/control-center/platform-intelligence/types/platform-intelligence-types";
import {
  exportPlatformIntelligence,
  getPlatformIntelligenceBundle,
} from "@/services/control-center-platform-intelligence.service";

function revalidateIntelligencePage() {
  revalidatePath(PLATFORM_INTELLIGENCE_ROUTES.hub);
}

export async function refreshPlatformIntelligenceAction(query: PlatformIntelligenceQuery = {}) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_INTELLIGENCE, async ({
    operator,
  }) => getPlatformIntelligenceBundle(operator, query));
}

export async function exportPlatformIntelligenceAction(
  query: PlatformIntelligenceQuery = {},
  format: "csv" | "json" = "json",
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_INTELLIGENCE, async ({
    operator,
  }) => exportPlatformIntelligence(operator, query, format));
}

export async function queryPlatformIntelligenceAction(query: PlatformIntelligenceQuery) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_INTELLIGENCE, async ({
    operator,
  }) => {
    const bundle = await getPlatformIntelligenceBundle(operator, query);
    revalidateIntelligencePage();
    return bundle;
  });
}
