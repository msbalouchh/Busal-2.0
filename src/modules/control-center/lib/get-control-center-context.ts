import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { requireControlCenterSession } from "@/modules/control-center/guards/control-center.guards";
import { resolveControlCenterFeatureFlags } from "@/modules/control-center/lib/resolve-control-center-feature-flags";
import { serializeClientControlCenterContext } from "@/modules/control-center/lib/serialize-control-center-context";

export const getControlCenterShellContext = cache(async () => {
  const operator = await requireControlCenterSession();
  const featureFlags = await resolveControlCenterFeatureFlags();
  const openAlerts = await prisma.monitoringAlert.count({ where: { status: "OPEN" } });
  const clientContext = serializeClientControlCenterContext(operator, featureFlags, openAlerts);

  return {
    operator,
    clientContext,
  };
});
