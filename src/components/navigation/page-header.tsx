import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  primaryAction,
  secondaryActions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}
    >
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <div className="bg-muted text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        ) : null}
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
        </div>
      </div>

      {primaryAction || secondaryActions ? (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {secondaryActions ? (
            <div className="flex flex-wrap items-center gap-2">{secondaryActions}</div>
          ) : null}
          {primaryAction ? <div>{primaryAction}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
