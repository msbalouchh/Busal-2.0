"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { SETTINGS_ENGINE_ROUTES } from "@/modules/settings-engine/constants/routes";
import type {
  ConfigurationImportInput,
  SetConfigurationInput,
} from "@/modules/settings-engine/types/settings-engine-types";
import {
  deleteConfigurationValue,
  exportConfiguration,
  importConfiguration,
  rollbackConfigurationValue,
  setConfigurationValue,
} from "@/services/settings-engine.service";

export async function setConfigurationValueAction(input: SetConfigurationInput) {
  return protectedAction(PERMISSION_CODES.SETTINGS_EDIT, async ({ platform }) => {
    const result = await setConfigurationValue(platform, input);
    revalidatePath(SETTINGS_ENGINE_ROUTES.values);
    revalidatePath(SETTINGS_ENGINE_ROUTES.versions);
    return result;
  });
}

export async function deleteConfigurationValueAction(valueId: string) {
  return protectedAction(PERMISSION_CODES.SETTINGS_MANAGE, async ({ platform }) => {
    await deleteConfigurationValue(platform, valueId);
    revalidatePath(SETTINGS_ENGINE_ROUTES.values);
    revalidatePath(SETTINGS_ENGINE_ROUTES.audit);
  });
}

export async function rollbackConfigurationValueAction(valueId: string, targetVersion: number) {
  return protectedAction(PERMISSION_CODES.SETTINGS_MANAGE, async ({ platform }) => {
    const result = await rollbackConfigurationValue(platform, valueId, targetVersion);
    revalidatePath(SETTINGS_ENGINE_ROUTES.values);
    revalidatePath(SETTINGS_ENGINE_ROUTES.versions);
    return result;
  });
}

export async function exportConfigurationAction(
  environment?: "DEVELOPMENT" | "STAGING" | "PRODUCTION",
) {
  return protectedAction(PERMISSION_CODES.SETTINGS_MANAGE, async ({ platform }) =>
    exportConfiguration(platform, environment),
  );
}

export async function importConfigurationAction(input: ConfigurationImportInput) {
  return protectedAction(PERMISSION_CODES.SETTINGS_MANAGE, async ({ platform }) => {
    const result = await importConfiguration(platform, input);
    revalidatePath(SETTINGS_ENGINE_ROUTES.values);
    revalidatePath(SETTINGS_ENGINE_ROUTES.audit);
    return result;
  });
}
