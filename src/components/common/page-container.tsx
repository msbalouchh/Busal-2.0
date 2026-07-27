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
    <div className={cn("flex flex-1 flex-col gap-6 p-6", className)}>
      {(title || description || actions) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            {title ? <h1 className="text-2xl font-bold tracking-tight">{title}</h1> : null}
            {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      )}
      {children}
    </div>
  );
}
