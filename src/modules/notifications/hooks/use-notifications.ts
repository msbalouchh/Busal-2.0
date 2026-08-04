"use client";

import { useContext } from "react";

import { NotificationContext } from "@/modules/notifications/contexts/notification-context";
import type { NotificationContextValue } from "@/modules/notifications/types/notification-platform";

export function useNotificationContext(): NotificationContextValue {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotificationContext must be used within NotificationProvider");
  }

  return context;
}

export function useNotifications(): NotificationContextValue {
  return useNotificationContext();
}
