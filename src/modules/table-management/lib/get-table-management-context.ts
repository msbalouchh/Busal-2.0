import { cache } from "react";

import { TABLE_PERMISSIONS } from "@/modules/table-management/constants/permissions";
import {
  buildTablePlatformSnapshot,
} from "@/modules/table-management/services/table-platform.service";
import {
  resolveTableScope,
  toTablePlatformContext,
} from "@/modules/table-management/lib/table-scope";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import type { TablePlatformSnapshot } from "@/modules/table-management/types/table-management";

export const getTableManagementContext = cache(async () => {
  const platform = await protectedPage({ permission: TABLE_PERMISSIONS.TABLE_READ });
  const scope = resolveTableScope(platform);
  const platformContext = toTablePlatformContext(scope);
  const snapshot = await buildTablePlatformSnapshot({
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    userId: scope.userId,
  });

  const permissions = platform.permissions;

  return {
    user: platform.user,
    business: platform.business,
    branchId: scope.branchId,
    platformContext,
    snapshot,
    permissions: {
      canRead: permissions.includes(TABLE_PERMISSIONS.TABLE_READ),
      canCreate: permissions.includes(TABLE_PERMISSIONS.TABLE_CREATE),
      canUpdate: permissions.includes(TABLE_PERMISSIONS.TABLE_UPDATE),
      canDelete: permissions.includes(TABLE_PERMISSIONS.TABLE_DELETE),
      canManage: permissions.includes(TABLE_PERMISSIONS.TABLE_MANAGE),
    },
  };
});

export type TableManagementPageContext = Awaited<ReturnType<typeof getTableManagementContext>>;

export async function getTableManagementSnapshot(): Promise<TablePlatformSnapshot> {
  const context = await getTableManagementContext();
  return context.snapshot;
}
