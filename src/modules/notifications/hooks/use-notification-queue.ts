"use client";

import { useMemo } from "react";

import { useNotifications } from "@/modules/notifications/hooks/use-notifications";
import { getPendingQueueCount } from "@/modules/notifications/utils/notification-delivery-utils";
import type { NotificationQueueContextValue } from "@/modules/notifications/types/notification-platform";

export function useNotificationQueue(): NotificationQueueContextValue {
  const { record, refresh } = useNotifications();

  const queue = useMemo(() => record.queue, [record.queue]);

  const pendingCount = useMemo(() => getPendingQueueCount(queue), [queue]);

  const failedCount = useMemo(() => queue.filter((q) => q.status === "failed").length, [queue]);

  return {
    queue,
    pendingCount,
    failedCount,
    refresh,
  };
}
