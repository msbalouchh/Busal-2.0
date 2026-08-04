import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  NOTIFICATION_PRIORITY_LABELS,
  type NotificationPriority,
} from "@/modules/notifications/constants/notification-status";

interface NotificationPriorityBadgeProps {
  priority: NotificationPriority;
  className?: string;
}

const PRIORITY_VARIANT: Record<
  NotificationPriority,
  "default" | "secondary" | "outline" | "destructive"
> = {
  low: "outline",
  normal: "secondary",
  high: "default",
  urgent: "destructive",
};

export function NotificationPriorityBadge({ priority, className }: NotificationPriorityBadgeProps) {
  return (
    <Badge variant={PRIORITY_VARIANT[priority]} className={cn("font-normal", className)}>
      {NOTIFICATION_PRIORITY_LABELS[priority]}
    </Badge>
  );
}
