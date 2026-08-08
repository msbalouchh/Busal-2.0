import "server-only";

import { cache } from "react";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type {
  WorkspaceNotification,
  WorkspaceSummary,
} from "@/modules/application-shell/types/workspace-shell.types";
import { tenantFoundationService } from "@/modules/tenant/services/tenant-foundation.service";
import { notificationService } from "@/modules/notifications/services/notification.service";
import { toNotificationPlatformContext } from "@/modules/notifications/lib/notification-scope";

export interface WorkspaceShellData {
  workspaceName: string;
  businessName: string;
  branchName: string | null;
  workspaces: WorkspaceSummary[];
  notifications: WorkspaceNotification[];
}

export const getWorkspaceShellData = cache(async (context: BusinessContext): Promise<WorkspaceShellData> => {
  const businessId = context.business.id;
  const branchId = context.branchId ?? context.branch?.id;
  const snapshot = await tenantFoundationService.buildSnapshotForBusiness(businessId, branchId);

  const workspaces: WorkspaceSummary[] = snapshot.workspaces.map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    role: "owner",
    isActive: workspace.id === snapshot.workspace.id,
  }));

  let notifications: WorkspaceNotification[] = [];

  if (branchId) {
    try {
      const notificationContext = toNotificationPlatformContext({
        tenantId: businessId,
        workspaceId: snapshot.workspace.id,
        businessId,
        branchId,
        userId: context.user.id,
      });

      const feed = await notificationService.searchNotifications(notificationContext, {
        limit: 20,
      });

      notifications = feed.items.map((notification) => ({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        category: "system",
        createdAt: notification.createdAt,
        read: notification.readAt !== null,
      }));
    } catch {
      notifications = [];
    }
  }

  return {
    workspaceName: context.business.businessName?.trim() || snapshot.workspace.name,
    businessName: context.business.businessName?.trim() || "Your business",
    branchName: context.branch?.name ?? null,
    workspaces,
    notifications,
  };
});
