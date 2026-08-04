"use client";

import { useMemo } from "react";

import { useNotifications } from "@/modules/notifications/hooks/use-notifications";
import type { NotificationPreferencesContextValue } from "@/modules/notifications/types/notification-platform";

export function useNotificationPreferences(): NotificationPreferencesContextValue {
  const { record, refresh } = useNotifications();

  const preferences = useMemo(() => record.preferences, [record.preferences]);
  const channels = useMemo(() => record.channels, [record.channels]);

  return {
    preferences,
    channels,
    refresh,
  };
}
