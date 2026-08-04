import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  WEBHOOK_EVENT_STATUS_LABELS,
  type WebhookEventStatus,
} from "@/modules/integrations/constants/integration-status";

interface WebhookEventStatusBadgeProps {
  status: WebhookEventStatus;
  className?: string;
}

const STATUS_VARIANT: Record<
  WebhookEventStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "outline",
  delivered: "default",
  failed: "destructive",
  retrying: "secondary",
};

export function WebhookEventStatusBadge({ status, className }: WebhookEventStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn("font-normal", className)}>
      {WEBHOOK_EVENT_STATUS_LABELS[status]}
    </Badge>
  );
}
