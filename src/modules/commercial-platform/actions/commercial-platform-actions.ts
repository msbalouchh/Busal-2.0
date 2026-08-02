"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { COMMERCIAL_PLATFORM_ROUTES } from "@/modules/commercial-platform/constants/commercial-platform";
import type {
  LeadDirectoryQuery,
  UpdateCommercialLeadInput,
} from "@/modules/commercial-platform/types/commercial-platform-types";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import {
  queryCommercialLeads,
  updateCommercialLead,
} from "@/services/commercial-platform-module.service";

function revalidateCommercialPages() {
  Object.values(COMMERCIAL_PLATFORM_ROUTES).forEach((path) => revalidatePath(path));
}

export async function queryCommercialLeadsAction(query: LeadDirectoryQuery = {}) {
  return protectedAction(PERMISSION_CODES.SALES_VIEW, async ({ platform }) => {
    const directory = await queryCommercialLeads(platform, query);
    return { directory };
  });
}

export async function updateCommercialLeadAction(input: UpdateCommercialLeadInput) {
  return protectedAction(PERMISSION_CODES.SALES_UPDATE, async ({ platform }) => {
    const lead = await updateCommercialLead(platform, input);
    revalidateCommercialPages();
    return { lead };
  });
}
