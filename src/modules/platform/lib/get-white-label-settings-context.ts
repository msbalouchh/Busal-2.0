import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  getPlatformConsumptionConfig,
  getPlatformEntitlementsForBusiness,
} from "@/modules/platform/services/platform-config.service";

export const getWhiteLabelSettingsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.TENANT_PLATFORM_VIEW });
  const [config, entitlements] = await Promise.all([
    getPlatformConsumptionConfig(context.business.id),
    getPlatformEntitlementsForBusiness(context.business.id),
  ]);

  return { context, config, entitlements };
});
