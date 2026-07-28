import { cache } from "react";

import { getDashboardContext } from "@/modules/dashboard/lib/get-dashboard-context";
import {
  ensureDefaultBusinessHours,
  ensureMainBranch,
  listBranches,
  listBusinessContacts,
  listBusinessHours,
} from "@/services/business-management.service";

export const getBusinessModuleContext = cache(async () => {
  const context = await getDashboardContext();

  await ensureMainBranch(context.business.id);
  await ensureDefaultBusinessHours(context.business.id);

  const [branches, hours, contacts] = await Promise.all([
    listBranches(context.business.id),
    listBusinessHours(context.business.id),
    listBusinessContacts(context.business.id),
  ]);

  return {
    user: context.user,
    business: context.business,
    branches,
    hours,
    contacts,
  };
});
