"use client";

import type { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface TopNavProps {
  title?: ReactNode;
  breadcrumb?: ReactNode;
  search?: ReactNode;
  actions?: ReactNode;
  notifications?: ReactNode;
  profile?: ReactNode;
  leading?: ReactNode;
  className?: string;
}

export function TopNav({
  title,
  breadcrumb,
  search,
  actions,
  notifications,
  profile,
  leading,
  className,
}: TopNavProps) {
  return (
    <header
      className={cn(
        "bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 border-b backdrop-blur",
        className,
      )}
    >
      <div className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        {leading ? (
          <div className="flex shrink-0 items-center gap-2">
            {leading}
            <Separator orientation="vertical" className="hidden h-6 sm:block" />
          </div>
        ) : null}

        <div className="min-w-0 flex-1 space-y-1">
          {title ? <div className="min-w-0">{title}</div> : null}
          {breadcrumb ? <div className="min-w-0">{breadcrumb}</div> : null}
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 md:ml-auto md:w-auto md:shrink-0">
          {search ? <div className="w-full min-w-0 sm:w-auto">{search}</div> : null}
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
          {notifications ? <div className="shrink-0">{notifications}</div> : null}
          {profile ? <div className="shrink-0">{profile}</div> : null}
        </div>
      </div>
    </header>
  );
}
