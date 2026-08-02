import type { MarketplaceItemStatus, MarketplaceLicenseStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PUBLISHED: "default",
  DRAFT: "secondary",
  DEPRECATED: "outline",
  ARCHIVED: "destructive",
  ACTIVE: "default",
  EXPIRED: "destructive",
  TRIAL: "secondary",
  CANCELLED: "outline",
  OPEN: "destructive",
  RESOLVED: "default",
  DISMISSED: "outline",
};

export function marketplaceStatusBadgeVariant(
  status: MarketplaceItemStatus | MarketplaceLicenseStatus | string,
): "default" | "secondary" | "destructive" | "outline" {
  return STATUS_VARIANTS[status] ?? "outline";
}

interface MarketplaceStatusBadgeProps {
  status: string;
  label?: string;
}

export function MarketplaceStatusBadge({ status, label }: MarketplaceStatusBadgeProps) {
  return (
    <Badge variant={marketplaceStatusBadgeVariant(status)}>
      {label ?? status.replace(/_/g, " ")}
    </Badge>
  );
}

export function publisherVerificationBadge(verified: boolean, suspended: boolean) {
  if (suspended) {
    return <Badge variant="destructive">Suspended</Badge>;
  }

  if (verified) {
    return <Badge variant="default">Verified</Badge>;
  }

  return <Badge variant="secondary">Unverified</Badge>;
}
