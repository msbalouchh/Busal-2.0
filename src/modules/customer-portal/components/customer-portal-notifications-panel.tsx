"use client";

import { useTransition } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { markCustomerNotificationReadAction } from "@/modules/customer-portal/actions/customer-portal-actions";
import { formatPortalDate } from "@/modules/customer-portal/components/customer-portal-format";

import type { CustomerNotificationList } from "@/modules/customer-portal/types/customer-portal";

interface CustomerPortalNotificationsPanelProps {
  notifications: CustomerNotificationList;
}

export function CustomerPortalNotificationsPanel({
  notifications,
}: CustomerPortalNotificationsPanelProps) {
  const [isPending, startTransition] = useTransition();

  if (notifications.length === 0) {
    return (
      <EmptyState
        title="No notifications"
        description="Updates from the business will appear here."
        icon={<Bell className="text-muted-foreground h-6 w-6" />}
      />
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <Card key={notification.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-base">{notification.title}</CardTitle>
              <Badge variant={notification.status === "UNREAD" ? "default" : "secondary"}>
                {notification.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{notification.body}</p>
            <p className="text-muted-foreground text-xs">
              {formatPortalDate(notification.createdAt)}
              {notification.category ? ` · ${notification.category}` : ""}
            </p>
            {notification.status === "UNREAD" ? (
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await markCustomerNotificationReadAction(notification.id);
                      toast.success("Marked as read");
                    } catch (error) {
                      toast.error(
                        error instanceof Error ? error.message : "Unable to mark as read.",
                      );
                    }
                  })
                }
              >
                Mark as read
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
