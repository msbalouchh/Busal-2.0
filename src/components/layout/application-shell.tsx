"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";

import { BusalBrandMark } from "@/components/brand/busal-brand-mark";
import { SkipToContent } from "@/components/common/skip-to-content";
import {
  APPLICATION_SHELL_NAV_ITEMS,
  isApplicationShellPathActive,
} from "@/components/layout/application-shell-config";
import {
  NavigationSidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarInset,
  SidebarItem,
  SidebarTrigger,
  TopNav,
  useNavigationSidebar,
} from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { NotificationInboxItemView } from "@/modules/notifications/utils/notification-utils";
import {
  CommandSearch,
  NotificationDropdown,
  PageTransition,
  UserMenu,
} from "@/modules/application-shell";

interface ApplicationShellProps {
  children: ReactNode;
  userName?: string;
  userEmail?: string;
  notifications?: NotificationInboxItemView[];
}

function ApplicationShellBrand({ collapsed }: { collapsed: boolean }) {
  return <BusalBrandMark compact={collapsed} height={32} className={cn(collapsed && "mx-auto")} />;
}

function ApplicationShellNavigation() {
  const pathname = usePathname();

  return (
    <SidebarContent>
      <SidebarGroup title="Modules" collapsible={false}>
        {APPLICATION_SHELL_NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={isApplicationShellPathActive(pathname, item.href)}
          />
        ))}
      </SidebarGroup>
    </SidebarContent>
  );
}

function ApplicationShellSidebar() {
  const { isCollapsed, isMobile, close } = useNavigationSidebar();
  const pathname = usePathname();
  const collapsed = !isMobile && isCollapsed;

  useEffect(() => {
    if (isMobile) {
      close();
    }
  }, [pathname, isMobile, close]);

  return (
    <Sidebar
      className={cn(
        "top-14 h-[calc(100vh-3.5rem)]",
        "motion-safe:transition-[width,transform] motion-safe:duration-200 motion-reduce:transition-none",
      )}
      brand={<ApplicationShellBrand collapsed={collapsed} />}
      aria-label="Application modules"
    >
      <ApplicationShellNavigation />
    </Sidebar>
  );
}

function ApplicationShellTopNav({
  userName,
  userEmail,
  notifications,
}: {
  userName?: string;
  userEmail?: string;
  notifications?: NotificationInboxItemView[];
}) {
  const pathname = usePathname();

  const { isCollapsed, isMobile } = useNavigationSidebar();

  const pageTitle = useMemo(() => {
    const current = APPLICATION_SHELL_NAV_ITEMS.find((item) =>
      isApplicationShellPathActive(pathname, item.href),
    );

    return current?.label ?? "Busal OS";
  }, [pathname]);

  const headerOffset = isMobile ? "left-0" : isCollapsed ? "left-16" : "left-64";

  return (
    <TopNav
      className={cn("fixed top-0 right-0 z-40", headerOffset)}
      leading={<SidebarTrigger />}
      title={<h1 className="truncate text-lg font-semibold tracking-tight">{pageTitle}</h1>}
      search={<CommandSearch />}
      actions={
        <Button
          asChild
          variant="outline"
          size="sm"
          className={cn("hidden gap-2 sm:inline-flex", motion.buttonPress)}
        >
          <Link href="/app/ai">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Ask AI
          </Link>
        </Button>
      }
      notifications={<NotificationDropdown initialNotifications={notifications} />}
      profile={<UserMenu userName={userName} userEmail={userEmail} />}
    />
  );
}

function ApplicationShellFrame({
  children,
  userName,
  userEmail,
  notifications,
}: ApplicationShellProps) {
  return (
    <div className={cn("bg-background min-h-screen")}>
      <SkipToContent />
      <ApplicationShellTopNav
        userName={userName}
        userEmail={userEmail}
        notifications={notifications}
      />
      <ApplicationShellSidebar />
      <SidebarInset className={cn("flex min-w-0 flex-col pt-14", motion.transition)}>
        <main id="main-content" className="min-h-[calc(100vh-3.5rem)] w-full min-w-0 flex-1">
          <PageTransition className="w-full min-w-0">{children}</PageTransition>
        </main>
      </SidebarInset>
    </div>
  );
}

export function ApplicationShell({
  children,
  userName,
  userEmail,
  notifications,
}: ApplicationShellProps) {
  return (
    <NavigationSidebarProvider defaultOpen={false} defaultCollapsed={false}>
      <ApplicationShellFrame
        userName={userName}
        userEmail={userEmail}
        notifications={notifications}
      >
        {children}
      </ApplicationShellFrame>
    </NavigationSidebarProvider>
  );
}
