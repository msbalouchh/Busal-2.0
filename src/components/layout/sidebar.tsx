"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { SidebarCollapseButton } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";
import { useDashboardContext } from "@/modules/dashboard/components/dashboard-provider";
import type { DashboardNavGroup, DashboardNavItem } from "@/modules/dashboard/types/dashboard";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar.store";

function isActivePath(pathname: string, href?: string): boolean {
  if (!href) {
    return false;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: DashboardNavItem;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const active = isActivePath(pathname, item.href);
  const className = cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50",
    collapsed && "justify-center px-2",
  );

  if (!item.href) {
    return (
      <div className={className} title={collapsed ? item.name : undefined}>
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {!collapsed ? item.name : null}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={className}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.name : undefined}
      onClick={onNavigate}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {!collapsed ? (
        <>
          <span className="flex-1">{item.name}</span>
          {item.badge ? (
            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-medium">
              {item.badge}
            </span>
          ) : null}
        </>
      ) : null}
    </Link>
  );
}

function NavGroupSection({
  group,
  pathname,
  collapsed,
  onNavigate,
}: {
  group: DashboardNavGroup;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(group.defaultOpen ?? false);
  const hasNested = group.items.some((item) => item.children?.length);
  const groupActive = group.items.some(
    (item) =>
      isActivePath(pathname, item.href) ||
      item.children?.some((child) => isActivePath(pathname, child.href)),
  );

  useEffect(() => {
    if (groupActive) {
      setOpen(true);
    }
  }, [groupActive]);

  if (collapsed) {
    return (
      <div className="space-y-1">
        {group.items.map((item) => (
          <NavLink
            key={item.id}
            item={item}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {group.items.length > 1 || hasNested ? (
        <button
          type="button"
          className="text-muted-foreground hover:text-sidebar-foreground flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold tracking-wide uppercase"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          <span>{group.name}</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
      ) : null}

      {(open || group.items.length === 1) && (
        <div className="space-y-1">
          {group.items.map((item) => (
            <div key={item.id} className="space-y-1">
              <NavLink
                item={item}
                pathname={pathname}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
              {item.children?.length ? (
                <div className="border-sidebar-border ml-6 space-y-1 border-l pl-2">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.id}
                      item={child}
                      pathname={pathname}
                      collapsed={false}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { navigation } = useDashboardContext();
  const { isOpen, isCollapsed, close, setMobile } = useSidebarStore();

  useEffect(() => {
    setMobile(isMobile);
  }, [isMobile, setMobile]);

  useEffect(() => {
    if (isMobile) {
      close();
    }
  }, [pathname, isMobile, close]);

  const widthClass = useMemo(() => {
    if (isMobile) {
      return "w-64";
    }

    return isCollapsed ? "w-16" : "w-64";
  }, [isCollapsed, isMobile]);

  return (
    <>
      {isMobile && isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50"
          onClick={close}
          aria-label="Close sidebar"
        />
      ) : null}

      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground border-sidebar-border fixed inset-y-0 left-0 z-50 flex flex-col border-r transition-all duration-200 ease-in-out",
          widthClass,
          isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-14 items-center justify-between px-3">
          <div
            className={cn("flex items-center gap-2 font-semibold", isCollapsed && "justify-center")}
          >
            <span className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm">
              B
            </span>
            {!isCollapsed ? <span className="truncate">{siteConfig.name}</span> : null}
          </div>
          {isMobile ? (
            <Button variant="ghost" size="icon" onClick={close} aria-label="Close menu">
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <SidebarCollapseButton />
          )}
        </div>

        <Separator />

        <ScrollArea className="flex-1 px-2 py-4">
          <nav className="space-y-4" aria-label="Dashboard navigation">
            {navigation.map((group) => (
              <NavGroupSection
                key={group.id}
                group={group}
                pathname={pathname}
                collapsed={!isMobile && isCollapsed}
                onNavigate={isMobile ? close : undefined}
              />
            ))}
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
}

export function SidebarTrigger() {
  const { toggle } = useSidebarStore();

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle sidebar">
      <Menu className="h-4 w-4" />
    </Button>
  );
}
