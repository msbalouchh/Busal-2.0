import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import { getBusinessProfileBundle } from "@/services/business-profile-module.service";

export const getBusinessProfileContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.BUSINESS_VIEW });
  const bundle = await getBusinessProfileBundle(platform);

  return {
    platform,
    business: bundle.business,
    profile: bundle.profile,
  };
});

export const getBusinessProfileEditContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.BUSINESS_UPDATE });
  const bundle = await getBusinessProfileBundle(platform);

  return {
    platform,
    business: bundle.business,
    profile: bundle.profile,
  };
});

export const getBusinessSettingsEditContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.SETTINGS_EDIT });
  const bundle = await getBusinessProfileBundle(platform);

  return {
    platform,
    business: bundle.business,
    profile: bundle.profile,
  };
});

export const getBusinessBranchManageContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.BRANCH_MANAGE });
  const bundle = await getBusinessProfileBundle(platform);

  return {
    platform,
    business: bundle.business,
    profile: bundle.profile,
  };
});
