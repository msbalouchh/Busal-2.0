"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { BUSINESS_PROFILE_ROUTES } from "@/modules/business/constants/business-profile";
import type {
  BusinessAddressUpdateInput,
  BusinessAssetUploadInput,
  BusinessBrandingUpdateInput,
  BusinessContactUpdateInput,
  BusinessProfileUpdateInput,
  BusinessSettingsUpdateInput,
} from "@/modules/business/types/business-profile-types";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import type { BranchInput } from "@/services/business-management.service";
import {
  createBusinessBranch,
  disableBusinessBranch,
  setDefaultBusinessBranch,
  updateBusinessAddress,
  updateBusinessBranch,
  updateBusinessBranding,
  updateBusinessContactInformation,
  updateBusinessProfile,
  updateBusinessSettingsPreferences,
  uploadBusinessAsset,
} from "@/services/business-profile-module.service";
import {
  saveBusinessHoursForBusiness,
  type BusinessHoursInput,
} from "@/services/business-management.service";

function revalidateBusinessProfilePages() {
  Object.values(BUSINESS_PROFILE_ROUTES).forEach((path) => revalidatePath(path));
}

export async function saveBusinessProfileAction(input: BusinessProfileUpdateInput) {
  return protectedAction(PERMISSION_CODES.BUSINESS_UPDATE, async ({ platform }) => {
    const profile = await updateBusinessProfile(platform, input);
    revalidateBusinessProfilePages();
    return { success: true as const, profile };
  });
}

export async function saveBusinessAddressAction(input: BusinessAddressUpdateInput) {
  return protectedAction(PERMISSION_CODES.BUSINESS_UPDATE, async ({ platform }) => {
    const profile = await updateBusinessAddress(platform, input);
    revalidateBusinessProfilePages();
    return { success: true as const, profile };
  });
}

export async function saveBusinessContactInfoAction(input: BusinessContactUpdateInput) {
  return protectedAction(PERMISSION_CODES.BUSINESS_UPDATE, async ({ platform }) => {
    const profile = await updateBusinessContactInformation(platform, input);
    revalidateBusinessProfilePages();
    return { success: true as const, profile };
  });
}

export async function saveBusinessBrandingAction(input: BusinessBrandingUpdateInput) {
  return protectedAction(PERMISSION_CODES.BUSINESS_UPDATE, async ({ platform }) => {
    const profile = await updateBusinessBranding(platform, input);
    revalidateBusinessProfilePages();
    return { success: true as const, profile };
  });
}

export async function saveBusinessSettingsAction(input: BusinessSettingsUpdateInput) {
  return protectedAction(PERMISSION_CODES.SETTINGS_EDIT, async ({ platform }) => {
    const profile = await updateBusinessSettingsPreferences(platform, input);
    revalidateBusinessProfilePages();
    return { success: true as const, profile };
  });
}

export async function uploadBusinessAssetAction(input: BusinessAssetUploadInput) {
  return protectedAction(PERMISSION_CODES.FILES_UPLOAD, async ({ platform }) => {
    const profile = await uploadBusinessAsset(platform, input);
    revalidateBusinessProfilePages();
    return { success: true as const, profile };
  });
}

export async function createBusinessBranchAction(input: BranchInput) {
  return protectedAction(PERMISSION_CODES.BRANCH_MANAGE, async ({ platform }) => {
    const profile = await createBusinessBranch(platform, input);
    revalidateBusinessProfilePages();
    return { success: true as const, profile };
  });
}

export async function updateBusinessBranchAction(branchId: string, input: BranchInput) {
  return protectedAction(PERMISSION_CODES.BRANCH_MANAGE, async ({ platform }) => {
    const profile = await updateBusinessBranch(platform, branchId, input);
    revalidateBusinessProfilePages();
    return { success: true as const, profile };
  });
}

export async function disableBusinessBranchAction(branchId: string) {
  return protectedAction(PERMISSION_CODES.BRANCH_MANAGE, async ({ platform }) => {
    const profile = await disableBusinessBranch(platform, branchId);
    revalidateBusinessProfilePages();
    return { success: true as const, profile };
  });
}

export async function setDefaultBusinessBranchAction(branchId: string) {
  return protectedAction(PERMISSION_CODES.BRANCH_MANAGE, async ({ platform }) => {
    const profile = await setDefaultBusinessBranch(platform, branchId);
    revalidateBusinessProfilePages();
    return { success: true as const, profile };
  });
}

export async function saveBusinessHoursProfileAction(hours: BusinessHoursInput[]) {
  return protectedAction(PERMISSION_CODES.BUSINESS_UPDATE, async ({ platform }) => {
    await saveBusinessHoursForBusiness(platform.business.id, hours);
    revalidateBusinessProfilePages();
    return { success: true as const };
  });
}
