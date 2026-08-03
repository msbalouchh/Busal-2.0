"use client";

import { Bell, Bot, Package, ShoppingCart, X } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { WorkspaceSidePanel } from "@/modules/application-shell/components/workspace-side-panel";
import { WORKSPACE_SHELL_ROUTES } from "@/modules/application-shell/constants/routes";
import { useWorkspaceShellContext } from "@/modules/application-shell/providers/workspace-shell-provider";
import type { WorkspaceNotification } from "@/modules/application-shell/types/workspace-shell.types";
import { formatRelativeTime } from "@/modules/application-shell/utils/format-relative-time";

const CATEGORY_ICONS = {
  order: ShoppingCart,
  ai: Bot,
  system: Package,
  marketing: Bell,
  staff: Bell,
  billing: Bell,
} as const;

function resolveCategoryIcon(category: WorkspaceNotification["category"]) {
  return CATEGORY_ICONS[category];
}

function NotificationRow({
  notification,
  onMarkRead,
}: {
  notification: WorkspaceNotification;
  onMarkRead: (id: string) => void;
}) {
  const Icon = resolveCategoryIcon(notification.category);

  return (
    <button
      type="button"
      className={cn(
        "hover:bg-accent flex w-full items-start gap-3 rounded-lg border p-3 text-left",
        !notification.read && "border-primary/20 bg-accent/40",
      )}
      onClick={() => onMarkRead(notification.id)}
    >
      <span className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{notification.title}</span>
          {!notification.read ? (
            <span className="bg-primary h-1.5 w-1.5 shrink-0 rounded-full" aria-hidden="true" />
          ) : null}
        </span>
        <span className="text-muted-foreground mt-1 block text-xs">{notification.body}</span>
        <time
          className="text-muted-foreground mt-2 block text-[10px]"
          dateTime={notification.createdAt}
        >
          {formatRelativeTime(notification.createdAt)}
        </time>
      </span>
    </button>
  );
}

export function NotificationCenter() {
  const {
    notifications,
    isNotificationCenterOpen,
    closeNotificationCenter,
    markNotificationRead,
    markAllNotificationsRead,
  } = useWorkspaceShellContext();

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <WorkspaceSidePanel
      open={isNotificationCenterOpen}
      onOpenChange={(open) => !open && closeNotificationCenter()}
      aria-label="Notification center"
    >
      <div className="flex items-center justify-between gap-3 border-b px-4 py-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground text-sm">
            Mock notification center for workspace activity.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={closeNotificationCenter}
          aria-label="Close notifications"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {unreadCount > 0 ? (
        <div className="flex items-center justify-between border-b px-4 py-2">
          <Badge variant="secondary">{unreadCount} unread</Badge>
          <Button
            variant="link"
            size="sm"
            className="h-auto px-0"
            onClick={markAllNotificationsRead}
          >
            Mark all read
          </Button>
        </div>
      ) : null}

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">No notifications yet.</p>
          ) : (
            notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onMarkRead={markNotificationRead}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <div className="border-t px-4 py-3">
        <Button asChild variant="outline" className="w-full">
          <Link href={WORKSPACE_SHELL_ROUTES.notifications}>View all notifications</Link>
        </Button>
      </div>
    </WorkspaceSidePanel>
  );
}

interface NotificationCenterTriggerProps {
  className?: string;
}

export function NotificationCenterTrigger({ className }: NotificationCenterTriggerProps) {
  const { notifications, openNotificationCenter } = useWorkspaceShellContext();
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("relative", className)}
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
      onClick={openNotificationCenter}
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
  );
}
