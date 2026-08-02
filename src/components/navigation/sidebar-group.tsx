"use client";

import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";

import { useNavigationSidebar } from "@/components/navigation/navigation-sidebar-context";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SidebarGroupProps {
  title: string;
  icon?: LucideIcon;
  badge?: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  collapsed?: boolean;
  forceOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function SidebarGroup({
  title,
  icon: Icon,
  badge,
  defaultOpen = true,
  collapsible = true,
  collapsed = false,
  forceOpen = false,
  children,
  className,
}: SidebarGroupProps) {
  const sidebar = useNavigationSidebar();
  const resolvedCollapsed = collapsed ?? (!sidebar.isMobile && sidebar.isCollapsed);
  const [open, setOpen] = useState(defaultOpen);
  const headingId = useId();

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
    }
  }, [forceOpen]);

  if (resolvedCollapsed) {
    return <div className={cn("space-y-1", className)}>{children}</div>;
  }

  const canCollapse = collapsible;

  return (
    <div className={cn("space-y-1", className)} role="group" aria-labelledby={headingId}>
      {canCollapse ? (
        <button
          id={headingId}
          type="button"
          className="text-muted-foreground hover:text-sidebar-foreground focus-visible:ring-ring flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold tracking-wide uppercase focus-visible:ring-2 focus-visible:outline-none"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
          <span className="flex-1 truncate text-left">{title}</span>
          {badge ? (
            typeof badge === "string" || typeof badge === "number" ? (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] uppercase">
                {badge}
              </Badge>
            ) : (
              badge
            )
          ) : null}
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
          />
        </button>
      ) : (
        <div
          id={headingId}
          className="text-muted-foreground flex items-center gap-2 px-3 py-2 text-xs font-semibold tracking-wide uppercase"
        >
          {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
          <span className="flex-1 truncate">{title}</span>
          {badge ? (
            typeof badge === "string" || typeof badge === "number" ? (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] uppercase">
                {badge}
              </Badge>
            ) : (
              badge
            )
          ) : null}
        </div>
      )}

      {open || !canCollapse ? <div className="space-y-1">{children}</div> : null}
    </div>
  );
}
