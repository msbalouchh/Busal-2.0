"use client";

import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { BusalBrandMark } from "@/components/brand/busal-brand-mark";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarItem,
  useNavigationSidebar,
} from "@/components/navigation";
import { cn } from "@/lib/utils";
import { WORKSPACE_PRIMARY_NAV } from "@/modules/application-shell/constants/navigation";
import type { WorkspaceNavItem } from "@/modules/application-shell/types/workspace-shell.types";
import { isWorkspaceNavItemActive } from "@/modules/application-shell/utils/navigation";

interface WorkspaceNavTreeItemProps {
  item: WorkspaceNavItem;
  pathname: string;
  level?: number;
}

function WorkspaceNavTreeItem({ item, pathname, level = 0 }: WorkspaceNavTreeItemProps) {
  const { isCollapsed, isMobile, close } = useNavigationSidebar();
  const sidebarCollapsed = !isMobile && isCollapsed;
  const active = isWorkspaceNavItemActive(pathname, item);
  const hasChildren = Boolean(item.children?.length);
  const childActive =
    item.children?.some((child) => isWorkspaceNavItemActive(pathname, child)) ?? false;
  const [expanded, setExpanded] = useState(active || childActive);

  useEffect(() => {
    if (childActive) {
      setExpanded(true);
    }
  }, [childActive]);

  const handleNavigate = isMobile ? close : undefined;

  if (!hasChildren) {
    return (
      <SidebarItem
        icon={item.icon}
        label={item.label}
        href={item.href}
        badge={item.badge}
        active={active}
        disabled={item.disabled}
        level={level}
        onClick={handleNavigate}
      />
    );
  }

  if (sidebarCollapsed) {
    return (
      <SidebarItem
        icon={item.icon}
        label={item.label}
        href={item.href ?? item.children?.[0]?.href}
        badge={item.badge}
        active={active || childActive}
        disabled={item.disabled}
        level={level}
        onClick={handleNavigate}
      />
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">
          <SidebarItem
            icon={item.icon}
            label={item.label}
            href={item.href}
            badge={item.badge}
            active={active}
            disabled={item.disabled}
            level={level}
            onClick={handleNavigate}
          />
        </div>
        <button
          type="button"
          className="text-muted-foreground hover:text-sidebar-foreground focus-visible:ring-ring mr-1 shrink-0 rounded p-1 focus-visible:ring-2 focus-visible:outline-none"
          aria-label={expanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
          />
        </button>
      </div>

      {expanded
        ? item.children?.map((child) => (
            <WorkspaceNavTreeItem
              key={child.id}
              item={child}
              pathname={pathname}
              level={level + 1}
            />
          ))
        : null}
    </div>
  );
}

function WorkspaceSidebarNavigation() {
  const pathname = usePathname();
  const { isMobile, close } = useNavigationSidebar();

  useEffect(() => {
    if (isMobile) {
      close();
    }
  }, [pathname, isMobile, close]);

  return (
    <>
      {WORKSPACE_PRIMARY_NAV.map((section) => (
        <SidebarGroup
          key={section.id}
          title={section.label}
          defaultOpen={section.defaultOpen ?? true}
          forceOpen={section.defaultOpen}
        >
          {section.items.map((item) => (
            <WorkspaceNavTreeItem key={item.id} item={item} pathname={pathname} />
          ))}
        </SidebarGroup>
      ))}
    </>
  );
}

function WorkspaceSidebarBrand() {
  const { isCollapsed, isMobile } = useNavigationSidebar();
  const compact = !isMobile && isCollapsed;

  return <BusalBrandMark compact={compact} priority />;
}

export function WorkspaceSidebar() {
  return (
    <Sidebar
      className="top-14 h-[calc(100vh-3.5rem)]"
      aria-label="Workspace modules"
      brand={<WorkspaceSidebarBrand />}
    >
      <SidebarContent>
        <WorkspaceSidebarNavigation />
      </SidebarContent>
    </Sidebar>
  );
}
