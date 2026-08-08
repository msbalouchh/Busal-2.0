import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type { NotificationPlatformContext } from "@/modules/notifications/types/notification-platform";

export interface NotificationTenantScope {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
}

export function resolveNotificationScope(platform: BusinessContext): NotificationTenantScope {
  const businessId = platform.business.id;
  const branchId = platform.branchId ?? platform.branch?.id;

  if (!branchId) {
    throw new Error("Branch context is required for notification operations");
  }

  return {
    tenantId: businessId,
    workspaceId: businessId,
    businessId,
    branchId,
    userId: platform.user.id,
  };
}

export function toNotificationPlatformContext(scope: NotificationTenantScope): NotificationPlatformContext {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    userId: scope.userId,
  };
}
