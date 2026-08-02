import type { QRCodeStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<QRCodeStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};

const STATUS_VARIANTS: Record<QRCodeStatus, "default" | "secondary" | "outline"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  ARCHIVED: "outline",
};

interface QrStatusBadgeProps {
  status: QRCodeStatus;
}

export function QrStatusBadge({ status }: QrStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}
