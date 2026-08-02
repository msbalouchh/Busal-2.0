import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type { ClientDashboardContext } from "@/modules/dashboard/types/dashboard";
import { getNotificationDashboard } from "@/services/notifications.service";

export async function serializeClientDashboardContext(
  context: BusinessContext,
  featureFlags: Record<string, boolean>,
): Promise<ClientDashboardContext> {
  let unreadNotifications = 0;

  try {
    const metrics = await getNotificationDashboard(context.business.id);
    unreadNotifications = metrics.unreadInbox;
  } catch {
    unreadNotifications = 0;
  }

  return {
    permissions: Array.from(context.authorization.permissions),
    featureFlags,
    isOwner: context.isOwner,
    unreadNotifications,
  };
}
