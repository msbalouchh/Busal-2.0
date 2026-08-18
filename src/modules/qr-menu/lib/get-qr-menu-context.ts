import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import { listQRCodesForBusiness } from "@/services/qr-menu.service";
import { listTablesForBusiness } from "@/services/table.service";

export const getQRMenuModuleContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.QR_MANAGE });

  const [qrCodes, tables] = await Promise.all([
    listQRCodesForBusiness(context.business.id, { branchId: context.branchId }),
    listTablesForBusiness(context.business.id, { branchId: context.branchId }),
  ]);

  return { user: context.user, qrCodes, tables };
});
