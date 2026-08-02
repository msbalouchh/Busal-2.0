import "server-only";

import { cache } from "react";

import { getDashboardContext } from "@/modules/dashboard/lib/get-dashboard-context";
import { resolveNavigationFeatureFlags } from "@/modules/dashboard/lib/resolve-navigation-feature-flags";
import { serializeClientDashboardContext } from "@/modules/dashboard/lib/serialize-dashboard-context";

export const getDashboardShellContext = cache(async () => {
  const context = await getDashboardContext();
  const featureFlags = await resolveNavigationFeatureFlags(context);
  const clientDashboard = await serializeClientDashboardContext(context, featureFlags);

  return {
    context,
    clientDashboard,
  };
});
