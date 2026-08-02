"use client";

import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ControlCenterEmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
}

export function ControlCenterEmptyState({
  title,
  description,
  icon,
  className,
}: ControlCenterEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center",
        className,
      )}
      data-component="empty-state"
    >
      <div className="bg-muted mb-4 flex h-12 w-12 items-center justify-center rounded-full">
        {icon ?? <Inbox className="text-muted-foreground h-6 w-6" aria-hidden="true" />}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? (
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">{description}</p>
      ) : null}
    </div>
  );
}
