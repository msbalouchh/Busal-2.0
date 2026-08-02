"use client";

import { Bell, Bot, Package, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  bulkInboxActionAction,
  markInboxItemReadAction,
} from "@/modules/notifications/actions/notification-actions";
import { NOTIFICATIONS_ROUTES } from "@/modules/notifications/constants/routes";
import type { NotificationInboxItemView } from "@/modules/notifications/utils/notification-utils";
import { formatRelativeTime } from "@/modules/application-shell/utils/format-relative-time";

const CATEGORY_ICONS = {
  ORDER: ShoppingCart,
  AI: Bot,
  SYSTEM: Package,
  MARKETING: Bell,
  STAFF: Bell,
  BILLING: Bell,
} as const;

function resolveCategoryIcon(category: string) {
  const key = category.toUpperCase() as keyof typeof CATEGORY_ICONS;
  return CATEGORY_ICONS[key] ?? Bell;
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: NotificationInboxItemView;
  onMarkRead: (id: string) => void;
}) {
  const Icon = resolveCategoryIcon(notification.category);
  const isUnread = notification.readAt === null;

  return (
    <DropdownMenuItem
      className={cn("flex cursor-default items-start gap-3 p-3", isUnread && "bg-accent/50")}
      onSelect={(event) => {
        event.preventDefault();
        if (isUnread) {
          onMarkRead(notification.id);
        }
      }}
    >
      <span className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 space-y-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{notification.title}</span>
          {isUnread ? (
            <span className="bg-primary h-1.5 w-1.5 shrink-0 rounded-full" aria-hidden="true" />
          ) : null}
        </span>
        <span className="text-muted-foreground block text-xs">{notification.body}</span>
        <time className="text-muted-foreground text-[10px]" dateTime={notification.createdAt}>
          {formatRelativeTime(notification.createdAt)}
        </time>
      </span>
    </DropdownMenuItem>
  );
}

interface NotificationDropdownProps {
  initialNotifications?: NotificationInboxItemView[];
}

export function NotificationDropdown({ initialNotifications = [] }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isPending, startTransition] = useTransition();

  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.readAt === null).length,
    [notifications],
  );

  function markRead(id: string) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, readAt: new Date().toISOString() }
          : notification,
      ),
    );

    startTransition(async () => {
      await markInboxItemReadAction(id);
    });
  }

  function markAllRead() {
    const unreadIds = notifications
      .filter((notification) => notification.readAt === null)
      .map((notification) => notification.id);

    if (unreadIds.length === 0) {
      return;
    }

    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((notification) =>
        notification.readAt === null ? { ...notification, readAt } : notification,
      ),
    );

    startTransition(async () => {
      await bulkInboxActionAction({ inboxItemIds: unreadIds, action: "read" });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", motion.buttonPress)}
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications, no unread items"
          }
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center px-1 text-[10px]"
            >
              {unreadCount}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              disabled={isPending}
              onClick={markAllRead}
            >
              Mark all read
            </Button>
          ) : null}
        </div>

        <DropdownMenuSeparator className="m-0" />

        <ScrollArea className="h-72">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground px-4 py-8 text-center text-sm">
              No notifications yet
            </p>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={markRead}
              />
            ))
          )}
        </ScrollArea>

        <DropdownMenuSeparator className="m-0" />

        <div className="px-3 py-2 text-center">
          <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
            <Link href={NOTIFICATIONS_ROUTES.inbox}>View all notifications</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
