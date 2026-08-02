import { cache } from "react";

import { getBusinessProfileContext } from "@/modules/business/lib/get-business-profile-context";

export const getBusinessModuleContext = cache(async () => {
  const context = await getBusinessProfileContext();

  return {
    user: context.platform.user,
    business: context.business,
    branches: context.profile.branches,
    hours: context.profile.hours,
    contacts: context.profile.contacts,
    profile: context.profile,
  };
});
