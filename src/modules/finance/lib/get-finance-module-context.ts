import { cache } from "react";

import { FINANCE_MODULE_PERMISSIONS } from "@/modules/finance/constants/permissions";
import { assertFinanceFeatureFromPlatform } from "@/modules/finance/feature-access/guards/feature.guard";
import { resolveFinanceScope, toFinancePlatformContext } from "@/modules/finance/lib/finance-scope";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import { buildFinancePlatformSnapshot } from "@/modules/finance/services/finance-platform.service";
import { financeService } from "@/modules/finance/services/finance.service";

export const getFinancePlatformModuleContext = cache(async () => {
  const platform = await protectedPage({ permission: FINANCE_MODULE_PERMISSIONS.FINANCE_READ });
  await assertFinanceFeatureFromPlatform(platform);
  const scope = resolveFinanceScope(platform);
  const context = toFinancePlatformContext(scope);

  const [snapshot, accounts] = await Promise.all([
    buildFinancePlatformSnapshot(context),
    financeService.listAccounts(context),
  ]);

  return {
    ...snapshot,
    accounts,
  };
});
