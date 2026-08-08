"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterAction } from "@/modules/control-center/guards/control-center.guards";
import { CONTROL_CENTER_PLATFORM_SETTINGS_ROUTES } from "@/modules/control-center/settings/constants/control-center-platform-settings";
import type {
  ControlCenterPlatformSettingsQuery,
  ImportControlCenterPlatformSettingsInput,
  ResetControlCenterPlatformSettingInput,
  UpdateControlCenterPlatformSettingInput,
} from "@/modules/control-center/settings/types/control-center-platform-settings-types";
import {
  exportControlCenterPlatformSettings,
  getControlCenterPlatformSettingHistory,
  getControlCenterPlatformSettingsBundle,
  importControlCenterPlatformSettings,
  resetControlCenterPlatformSetting,
  updateControlCenterPlatformSetting,
} from "@/services/control-center-platform-settings.service";

function revalidateSettingsPages() {
  revalidatePath(CONTROL_CENTER_PLATFORM_SETTINGS_ROUTES.hub);
}

export async function refreshControlCenterPlatformSettingsAction(
  query: ControlCenterPlatformSettingsQuery = {},
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_SETTINGS, async ({
    operator,
  }) => getControlCenterPlatformSettingsBundle(operator, query));
}

export async function updateControlCenterPlatformSettingAction(
  input: UpdateControlCenterPlatformSettingInput,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_SETTINGS, async ({
    operator,
  }) => {
    await updateControlCenterPlatformSetting(operator, input);
    revalidateSettingsPages();
  });
}

export async function resetControlCenterPlatformSettingAction(
  input: ResetControlCenterPlatformSettingInput,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_SETTINGS, async ({
    operator,
  }) => {
    await resetControlCenterPlatformSetting(operator, input);
    revalidateSettingsPages();
  });
}

export async function getControlCenterPlatformSettingHistoryAction(key: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_SETTINGS, async ({
    operator,
  }) => getControlCenterPlatformSettingHistory(operator, key));
}

export async function exportControlCenterPlatformSettingsAction() {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_SETTINGS, async ({
    operator,
  }) => exportControlCenterPlatformSettings(operator));
}

export async function importControlCenterPlatformSettingsAction(
  input: ImportControlCenterPlatformSettingsInput,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_SETTINGS, async ({
    operator,
  }) => {
    const result = await importControlCenterPlatformSettings(operator, input);
    revalidateSettingsPages();
    return result;
  });
}
