"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";
import { requireRestaurantActionContext } from "@/modules/restaurant-management/lib/get-restaurant-management-context";
import type {
  RestaurantBrandingInput,
  RestaurantFeatureToggleInput,
  RestaurantPreferencesInput,
  RestaurantSettingsInput,
} from "@/modules/restaurant-management/types/restaurant-management-types";
import {
  updateRestaurantBranding,
  updateRestaurantFeatureToggles,
  updateRestaurantPreferences,
  updateRestaurantSettings,
} from "@/services/restaurant-management.service";

function revalidateRestaurantPages() {
  Object.values(RESTAURANT_MANAGEMENT_ROUTES).forEach((path) => revalidatePath(path));
}

export async function saveRestaurantSettingsAction(input: RestaurantSettingsInput) {
  const context = await requireRestaurantActionContext(PERMISSION_CODES.RESTAURANT_SETTINGS);
  const settings = await updateRestaurantSettings(context.user.id, input);
  revalidateRestaurantPages();
  return { success: true as const, settings };
}

export async function saveRestaurantBrandingAction(input: RestaurantBrandingInput) {
  const context = await requireRestaurantActionContext(PERMISSION_CODES.RESTAURANT_BRANDING);
  const branding = await updateRestaurantBranding(context.user.id, input);
  revalidateRestaurantPages();
  return { success: true as const, branding };
}

export async function saveRestaurantPreferencesAction(input: RestaurantPreferencesInput) {
  const context = await requireRestaurantActionContext(PERMISSION_CODES.RESTAURANT_UPDATE);
  const settings = await updateRestaurantPreferences(context.user.id, input);
  revalidateRestaurantPages();
  return { success: true as const, settings };
}

export async function saveRestaurantFeatureTogglesAction(input: RestaurantFeatureToggleInput) {
  const context = await requireRestaurantActionContext(PERMISSION_CODES.RESTAURANT_UPDATE);
  const settings = await updateRestaurantFeatureToggles(context.user.id, input);
  revalidateRestaurantPages();
  return { success: true as const, settings };
}
