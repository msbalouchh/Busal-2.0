"use client";

import { CircleHelp, Settings } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

import { SidebarTrigger, TopNav, useNavigationSidebar } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AiAssistantButton } from "@/modules/application-shell/components/ai-assistant-button";
import { CommandPalette } from "@/modules/application-shell/components/command-palette";
import { NotificationCenterTrigger } from "@/modules/application-shell/components/notification-center";
import { UserMenu } from "@/modules/application-shell/components/user-menu";
import { WorkspaceSwitcher } from "@/modules/application-shell/components/workspace-switcher";
import { WORKSPACE_PRIMARY_NAV } from "@/modules/application-shell/constants/navigation";
import { WORKSPACE_SHELL_ROUTES } from "@/modules/application-shell/constants/routes";
import { resolveActiveWorkspaceNavLabel } from "@/modules/application-shell/utils/navigation";

interface WorkspaceHeaderProps {
  userName?: string;
  userEmail?: string;
  className?: string;
}

export function WorkspaceHeader({ userName, userEmail, className }: WorkspaceHeaderProps) {
  const pathname = usePathname();
  const { isCollapsed, isMobile } = useNavigationSidebar();

  const pageTitle = useMemo(
    () => resolveActiveWorkspaceNavLabel(pathname, WORKSPACE_PRIMARY_NAV),
    [pathname],
  );

  const headerOffset = isMobile ? "left-0" : isCollapsed ? "left-16" : "left-64";

  return (
    <TopNav
      className={cn("fixed top-0 right-0 z-40", headerOffset, className)}
      leading={
        <>
          <SidebarTrigger />
          <Separator orientation="vertical" className="hidden h-6 md:block" />
          <WorkspaceSwitcher className="min-w-0" />
        </>
      }
      title={
        <div className="min-w-0">
          <p className="text-muted-foreground hidden text-xs md:block">Workspace</p>
          <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">
            {pageTitle}
          </h1>
        </div>
      }
      search={<CommandPalette />}
      actions={
        <>
          <AiAssistantButton />
          <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
            <Link href={WORKSPACE_SHELL_ROUTES.help} aria-label="Help">
              <CircleHelp className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
            <Link href={WORKSPACE_SHELL_ROUTES.settings} aria-label="Settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </>
      }
      notifications={<NotificationCenterTrigger />}
      profile={<UserMenu userName={userName} userEmail={userEmail} />}
    />
  );
}
