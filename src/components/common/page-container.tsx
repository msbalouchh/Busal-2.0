import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageContainer({
  children,
  title,
  description,
  actions,
  className,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-7xl min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8",
        className,
      )}
    >
      {(title || description || actions) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            {title ? (
              <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                {title}
              </h1>
            ) : null}
            {description ? (
              <p className="text-muted-foreground max-w-2xl text-sm text-pretty sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      )}
      {children}
    </div>
  );
}
