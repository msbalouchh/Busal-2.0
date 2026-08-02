"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { BUSINESS_MODULE_ROUTES } from "@/modules/business-modules/constants/routes";
import { requireBusinessModuleActionContext } from "@/modules/business-modules/lib/get-business-modules-context";
import {
  disableBusinessModule,
  enableBusinessModule,
  installBusinessModule,
} from "@/services/business-module.service";

function revalidateBusinessModulePages(moduleKey?: string) {
  revalidatePath(BUSINESS_MODULE_ROUTES.dashboard);

  if (moduleKey) {
    revalidatePath(BUSINESS_MODULE_ROUTES.details(moduleKey));
  }
}

export async function installBusinessModuleAction(moduleKey: string) {
  const context = await requireBusinessModuleActionContext(PERMISSION_CODES.MODULES_INSTALL);
  await installBusinessModule(context.business.id, moduleKey);
  revalidateBusinessModulePages(moduleKey);
  return { success: true as const };
}

export async function enableBusinessModuleAction(moduleKey: string) {
  const context = await requireBusinessModuleActionContext(PERMISSION_CODES.MODULES_ENABLE);
  await enableBusinessModule(context.business.id, moduleKey);
  revalidateBusinessModulePages(moduleKey);
  return { success: true as const };
}

export async function disableBusinessModuleAction(moduleKey: string) {
  const context = await requireBusinessModuleActionContext(PERMISSION_CODES.MODULES_DISABLE);
  await disableBusinessModule(context.business.id, moduleKey);
  revalidateBusinessModulePages(moduleKey);
  return { success: true as const };
}
