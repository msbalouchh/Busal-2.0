"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { useNavigationSidebar } from "@/components/navigation/navigation-sidebar-context";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SidebarItemProps {
  icon?: LucideIcon;
  label: string;
  href?: string;
  badge?: ReactNode;
  active?: boolean;
  disabled?: boolean;
  level?: number;
  collapsed?: boolean;
  onClick?: () => void;
  children?: ReactNode;
  className?: string;
}

export function SidebarItem({
  icon: Icon,
  label,
  href,
  badge,
  active = false,
  disabled = false,
  level = 0,
  collapsed = false,
  onClick,
  children,
  className,
}: SidebarItemProps) {
  const sidebar = useNavigationSidebar();
  const resolvedCollapsed = collapsed ?? (!sidebar.isMobile && sidebar.isCollapsed);
  const paddingClass = level > 0 ? "ml-6 border-sidebar-border border-l pl-2" : undefined;

  const itemClassName = cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium motion-safe:transition-colors motion-safe:duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50",
    disabled && "pointer-events-none opacity-50",
    resolvedCollapsed && "justify-center px-2",
    className,
  );

  const content = (
    <>
      {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
      {!resolvedCollapsed ? (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge ? (
            typeof badge === "string" || typeof badge === "number" ? (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {badge}
              </Badge>
            ) : (
              badge
            )
          ) : null}
        </>
      ) : null}
    </>
  );

  const item =
    href && !disabled ? (
      <Link
        href={href}
        className={itemClassName}
        aria-current={active ? "page" : undefined}
        aria-disabled={disabled || undefined}
        title={resolvedCollapsed ? label : undefined}
        onClick={onClick}
      >
        {content}
      </Link>
    ) : (
      <button
        type="button"
        className={cn(itemClassName, "w-full text-left")}
        aria-current={active ? "page" : undefined}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        title={resolvedCollapsed ? label : undefined}
        onClick={onClick}
      >
        {content}
      </button>
    );

  if (!children) {
    return <div className={paddingClass}>{item}</div>;
  }

  return (
    <div className={cn("space-y-1", paddingClass)}>
      {item}
      <div className="space-y-1">{children}</div>
    </div>
  );
}
