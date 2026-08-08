import { cache } from "react";

import { POS_MODULE_PERMISSIONS } from "@/modules/pos/constants/permissions";
import { resolvePosScope, toPosPlatformContext } from "@/modules/pos/lib/pos-scope";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import { buildPosPlatformSnapshot } from "@/modules/pos/services/pos-platform.service";
import { posService } from "@/modules/pos/services/pos.service";

export const getPosModuleContext = cache(async () => {
  const platform = await protectedPage({ permission: POS_MODULE_PERMISSIONS.POS_READ });
  const scope = resolvePosScope(platform);
  const context = toPosPlatformContext(scope);

  const [snapshot, registers, terminals, shifts, employees, cashDrawers, activeSession] =
    await Promise.all([
      buildPosPlatformSnapshot(context),
      posService.listRegisters(context),
      posService.listTerminals(context),
      posService.listShifts(context),
      posService.listEmployees(context),
      posService.listCashDrawers(context),
      posService.getActiveSession(context),
    ]);

  return {
    ...snapshot,
    registers,
    terminals,
    shifts,
    employees,
    cashDrawers,
    activeSession,
  };
});
