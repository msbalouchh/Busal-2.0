import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  NOTIFICATION_CHANNEL_LABELS,
  type NotificationChannel,
} from "@/modules/notifications/constants/notification-status";

interface NotificationChannelBadgeProps {
  channel: NotificationChannel;
  className?: string;
}

const CHANNEL_VARIANT: Record<
  NotificationChannel,
  "default" | "secondary" | "outline" | "destructive"
> = {
  email: "default",
  sms: "secondary",
  whatsapp: "secondary",
  push: "outline",
  in_app: "default",
  slack: "outline",
  webhook: "secondary",
  custom: "outline",
};

export function NotificationChannelBadge({ channel, className }: NotificationChannelBadgeProps) {
  return (
    <Badge variant={CHANNEL_VARIANT[channel]} className={cn("font-normal", className)}>
      {NOTIFICATION_CHANNEL_LABELS[channel]}
    </Badge>
  );
}
