import "server-only";

import { cache } from "react";

import { requireBusinessContext } from "@/modules/business-context/services/business-context.service";
import {
  serializeInboxItem,
  type NotificationInboxItemView,
} from "@/modules/notifications/utils/notification-utils";
import { listNotificationInbox } from "@/services/notifications.service";

const SHELL_NOTIFICATION_LIMIT = 8;

export const getApplicationShellNotifications = cache(
  async (): Promise<NotificationInboxItemView[]> => {
    try {
      const platform = await requireBusinessContext();
      const inbox = await listNotificationInbox(platform);
      return inbox.slice(0, SHELL_NOTIFICATION_LIMIT).map(serializeInboxItem);
    } catch {
      return [];
    }
  },
);
