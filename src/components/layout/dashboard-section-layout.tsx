import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DashboardSectionLayoutProps {
  description?: string;
  nav?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Standard section wrapper for dashboard module layouts (padding lives in WorkspaceMainContent). */
export function DashboardSectionLayout({
  description,
  nav,
  children,
  className,
}: DashboardSectionLayoutProps) {
  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-6", className)}>
      {description ? (
        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">{description}</p>
      ) : null}
      {nav}
      {children}
    </div>
  );
}
