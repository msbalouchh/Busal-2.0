"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { LOCALIZATION_PLATFORM_ROUTES } from "@/modules/localization-platform/constants/routes";
import type {
  LanguagePackDefinition,
  RegisteredTranslationKeyDefinition,
  ScopeSettingInput,
  UpsertTranslationInput,
} from "@/modules/localization-platform/types/localization-platform-types";
import {
  loadLanguagePack,
  registerModuleTranslationKey,
  setBranchLanguageOverride,
  setBusinessLanguage,
  setUserLanguagePreference,
  upsertScopeSetting,
  upsertTranslation,
} from "@/services/localization-platform.service";

export async function registerModuleTranslationKeyAction(
  definition: RegisteredTranslationKeyDefinition,
) {
  return protectedAction(PERMISSION_CODES.LOCALIZATION_PLATFORM_MANAGE, async ({ platform }) => {
    await registerModuleTranslationKey(platform.business.id, definition);
    revalidatePath(LOCALIZATION_PLATFORM_ROUTES.registry);
    revalidatePath(LOCALIZATION_PLATFORM_ROUTES.audit);
  });
}

export async function upsertTranslationAction(input: UpsertTranslationInput) {
  return protectedAction(PERMISSION_CODES.LOCALIZATION_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await upsertTranslation(platform, input);
    revalidatePath(LOCALIZATION_PLATFORM_ROUTES.translations);
    revalidatePath(LOCALIZATION_PLATFORM_ROUTES.versions);
    revalidatePath(LOCALIZATION_PLATFORM_ROUTES.audit);
    return result;
  });
}

export async function loadLanguagePackAction(pack: LanguagePackDefinition) {
  return protectedAction(PERMISSION_CODES.LOCALIZATION_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await loadLanguagePack(platform, pack);
    revalidatePath(LOCALIZATION_PLATFORM_ROUTES.translations);
    revalidatePath(LOCALIZATION_PLATFORM_ROUTES.audit);
    return result;
  });
}

export async function setUserLanguagePreferenceAction(languageCode: string) {
  return protectedAction(PERMISSION_CODES.LOCALIZATION_PLATFORM_MANAGE, async ({ platform }) => {
    await setUserLanguagePreference(platform, languageCode);
    revalidatePath(LOCALIZATION_PLATFORM_ROUTES.preferences);
    revalidatePath(LOCALIZATION_PLATFORM_ROUTES.audit);
  });
}

export async function setBusinessLanguageAction(languageCode: string) {
  return protectedAction(PERMISSION_CODES.LOCALIZATION_PLATFORM_MANAGE, async ({ platform }) => {
    await setBusinessLanguage(platform, languageCode);
    revalidatePath(LOCALIZATION_PLATFORM_ROUTES.preferences);
    revalidatePath(LOCALIZATION_PLATFORM_ROUTES.audit);
  });
}

export async function setBranchLanguageOverrideAction(branchId: string, languageCode: string) {
  return protectedAction(PERMISSION_CODES.LOCALIZATION_PLATFORM_MANAGE, async ({ platform }) => {
    await setBranchLanguageOverride(platform, branchId, languageCode);
    revalidatePath(LOCALIZATION_PLATFORM_ROUTES.preferences);
    revalidatePath(LOCALIZATION_PLATFORM_ROUTES.audit);
  });
}

export async function upsertScopeSettingAction(input: ScopeSettingInput) {
  return protectedAction(PERMISSION_CODES.LOCALIZATION_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await upsertScopeSetting(platform, input);
    revalidatePath(LOCALIZATION_PLATFORM_ROUTES.preferences);
    revalidatePath(LOCALIZATION_PLATFORM_ROUTES.formatting);
    return result;
  });
}
