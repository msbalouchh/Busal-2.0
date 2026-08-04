import { createContext } from "react";

import type { NotificationContextValue } from "@/modules/notifications/types/notification-platform";

export const NotificationContext = createContext<NotificationContextValue | null>(null);
