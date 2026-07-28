import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import { listQRCodes } from "@/services/qr-menu.service";
import { listTables } from "@/services/table.service";

export const getQRMenuModuleContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.QR_MANAGE });

  const [qrCodes, tables] = await Promise.all([
    listQRCodes(context.business.ownerId, { branchId: context.branchId }),
    listTables(context.business.ownerId, { branchId: context.branchId }),
  ]);

  return { user: context.user, qrCodes, tables };
});
