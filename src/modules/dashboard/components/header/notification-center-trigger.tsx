"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { NOTIFICATIONS_ROUTES } from "@/modules/notifications/constants/routes";
import { useDashboardContext } from "@/modules/dashboard/components/dashboard-provider";

export function NotificationCenterTrigger() {
  const { unreadNotifications } = useDashboardContext();

  return (
    <Button asChild variant="ghost" size="icon" className="relative" aria-label="Notifications">
      <Link href={NOTIFICATIONS_ROUTES.inbox}>
        <Bell className="h-4 w-4" />
        {unreadNotifications > 0 ? (
          <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium">
            {unreadNotifications > 99 ? "99+" : unreadNotifications}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
