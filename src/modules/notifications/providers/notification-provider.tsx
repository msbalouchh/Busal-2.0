"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { NotificationContext } from "@/modules/notifications/contexts/notification-context";
import { buildNotificationPlatformContext } from "@/modules/notifications/services/notification-platform.service";
import type { NotificationPlatformSnapshot } from "@/modules/notifications/services/notification-platform.service";
import type { NotificationContextValue, NotificationPlatformContext } from "@/modules/notifications/types/notification-platform";

interface NotificationProviderProps {
  children: ReactNode;
  initialInput?: NotificationPlatformContext;
  initialSnapshot?: NotificationPlatformSnapshot;
}

export function NotificationProvider({ children, initialInput, initialSnapshot }: NotificationProviderProps) {
  const [input] = useState<NotificationPlatformContext>(
    () =>
      initialInput ??
      initialSnapshot?.context ??
      buildNotificationPlatformContext({ businessId: "", branchId: "" }),
  );
  const [snapshot, setSnapshot] = useState<NotificationPlatformSnapshot | null>(initialSnapshot ?? null);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setError(null);

    void fetch("/api/notifications?snapshot=true")
      .then(async (response) => {
        const payload = (await response.json()) as {
          success: boolean;
          data?: NotificationPlatformSnapshot;
          error?: string;
        };

        if (!payload.success || !payload.data) {
          throw new Error(payload.error ?? "Failed to refresh notifications");
        }

        setSnapshot(payload.data);
      })
      .catch((refreshError: unknown) => {
        setError(refreshError instanceof Error ? refreshError.message : "Refresh failed");
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, []);

  const value = useMemo<NotificationContextValue>(() => {
    const context = snapshot?.context ?? input;
    const record = snapshot?.record ?? {
      notifications: [],
      templates: [],
      channels: [],
      preferences: [],
      queue: [],
      deliveries: [],
      history: [],
      rules: [],
      events: [],
      schedules: [],
      recipients: [],
      campaigns: [],
      analytics: {
        tenantId: context.tenantId,
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
        totalRead: 0,
        deliveryRateBps: 0,
        readRateBps: 0,
        averageDeliveryTimeMs: 0,
        channelBreakdown: [],
        periodStart: "",
        periodEnd: "",
      },
      aiContext: {
        tenantId: context.tenantId,
        summary: "",
        unreadCount: 0,
        failedDeliveryCount: 0,
        recommendedChannel: null,
        optimalSendTime: null,
        insights: [],
        recommendedActions: [],
        lastGeneratedAt: new Date().toISOString(),
      },
    };

    const selectedNotification = selectedNotificationId
      ? (record.notifications.find((notification) => notification.id === selectedNotificationId) ?? null)
      : null;

    return {
      context,
      record,
      unreadCount: snapshot?.unreadCount ?? record.notifications.filter((n) => !n.isRead).length,
      selectedNotificationId,
      selectedNotification,
      selectNotification: setSelectedNotificationId,
      refresh,
      isRefreshing,
      error,
    };
  }, [input, snapshot, selectedNotificationId, refresh, isRefreshing, error]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
