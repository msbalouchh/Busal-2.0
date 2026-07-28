"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/constants/routes";
import {
  switchBranch,
  switchBusiness,
} from "@/modules/business-context/services/business-context.service";
import { serializeClientBusinessContext } from "@/modules/business-context/services/business-context.service";

export async function switchBusinessAction(businessId: string) {
  const context = await switchBusiness(businessId);
  revalidatePath(ROUTES.dashboard);
  return serializeClientBusinessContext(context);
}

export async function switchBranchAction(branchId: string) {
  const context = await switchBranch(branchId);
  revalidatePath(ROUTES.dashboard);
  return serializeClientBusinessContext(context);
}
