import Link from "next/link";

import { Button } from "@/components/ui/button";

interface StaffEmptyStateProps {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}

export function StaffEmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: StaffEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-12 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">{description}</p>
      {actionHref && actionLabel ? (
        <Button asChild className="mt-4">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
