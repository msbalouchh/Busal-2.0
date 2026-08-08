"use client";

import type { FeatureFlagStatus } from "@prisma/client";

const STATUS_CLASSES: Record<FeatureFlagStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  ACTIVE: "bg-emerald-500/10 text-emerald-600",
  SCHEDULED: "bg-blue-500/10 text-blue-600",
  ARCHIVED: "bg-amber-500/10 text-amber-600",
  DEPRECATED: "bg-destructive/10 text-destructive",
};

export function FeatureStatusBadge({ status }: { status: FeatureFlagStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium uppercase ${STATUS_CLASSES[status]}`}
    >
      {status}
    </span>
  );
}

export function FeatureCategoryBadge({ category }: { category: string }) {
  const classes =
    category === "emergency"
      ? "bg-destructive/10 text-destructive"
      : category === "beta"
        ? "bg-purple-500/10 text-purple-600"
        : category === "experimental"
          ? "bg-orange-500/10 text-orange-600"
          : "bg-muted text-muted-foreground";

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${classes}`}>
      {category}
    </span>
  );
}

export function FeatureScopeBadge({ scope }: { scope: string }) {
  return (
    <span className="bg-muted text-muted-foreground inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize">
      {scope}
    </span>
  );
}
