import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DashboardGridProps {
  children: ReactNode;
  className?: string;
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <div
      className={cn(
        "grid min-w-0 auto-rows-min grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface DashboardGridItemProps {
  children: ReactNode;
  span?: 1 | 2 | 3 | 4;
  className?: string;
}

export function DashboardGridItem({ children, span = 1, className }: DashboardGridItemProps) {
  return (
    <div
      className={cn(
        "min-w-0",
        span === 2 && "sm:col-span-2",
        span === 3 && "sm:col-span-2 xl:col-span-3",
        span === 4 && "sm:col-span-2 xl:col-span-3 2xl:col-span-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
