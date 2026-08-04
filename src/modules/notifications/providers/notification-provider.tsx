"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { NotificationContext } from "@/modules/notifications/contexts/notification-context";
import { notificationRepository } from "@/modules/notifications/repository/notification-repository";
import {
  buildNotificationPlatformContext,
  buildNotificationPlatformSnapshot,
  type NotificationPlatformInput,
} from "@/modules/notifications/services/notification-platform.service";
import type { NotificationContextValue } from "@/modules/notifications/types/notification-platform";

interface NotificationProviderProps {
  children: ReactNode;
  initialInput?: NotificationPlatformInput;
}

export function NotificationProvider({ children, initialInput }: NotificationProviderProps) {
  const [input] = useState<NotificationPlatformInput>(() => initialInput ?? {});
  const [snapshot, setSnapshot] = useState(() => buildNotificationPlatformSnapshot(input));
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSnapshot(buildNotificationPlatformSnapshot(input));
  }, [input]);

  const value = useMemo<NotificationContextValue>(() => {
    const context = buildNotificationPlatformContext(input);
    const selectedNotification = selectedNotificationId
      ? (notificationRepository.findNotificationById(selectedNotificationId) ?? null)
      : null;

    return {
      context,
      record: snapshot.record,
      unreadCount: snapshot.unreadCount,
      selectedNotificationId,
      selectedNotification,
      selectNotification: setSelectedNotificationId,
      refresh,
    };
  }, [input, snapshot, selectedNotificationId, refresh]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
