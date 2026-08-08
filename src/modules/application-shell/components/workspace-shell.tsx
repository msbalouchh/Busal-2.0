"use client";

import type { ReactNode } from "react";

import { SkipToContent } from "@/components/common/skip-to-content";
import { NavigationSidebarProvider } from "@/components/navigation";
import { cn } from "@/lib/utils";
import { NotificationCenter } from "@/modules/application-shell/components/notification-center";
import { WorkspaceHeader } from "@/modules/application-shell/components/workspace-header";
import { WorkspaceMainContent } from "@/modules/application-shell/components/workspace-main-content";
import { WorkspaceRightDrawer } from "@/modules/application-shell/components/workspace-right-drawer";
import { WorkspaceSidebar } from "@/modules/application-shell/components/workspace-sidebar";
import { WorkspaceShellProvider } from "@/modules/application-shell/providers/workspace-shell-provider";
import type { WorkspaceShellLayoutProps } from "@/modules/application-shell/types/workspace-shell.types";

interface WorkspaceShellFrameProps {
  children: ReactNode;
  userName?: string;
  userEmail?: string;
  businessName?: string;
  branchName?: string | null;
}

function WorkspaceShellFrame({
  children,
  userName,
  userEmail,
  businessName,
  branchName,
}: WorkspaceShellFrameProps) {
  return (
    <div className={cn("bg-background min-h-screen w-full overflow-x-clip")}>
      <SkipToContent />
      <WorkspaceHeader
        userName={userName}
        userEmail={userEmail}
        businessName={businessName}
        branchName={branchName}
      />
      <WorkspaceSidebar />
      <WorkspaceMainContent>{children}</WorkspaceMainContent>
      <NotificationCenter />
      <WorkspaceRightDrawer />
    </div>
  );
}

export function WorkspaceShell({
  children,
  workspaceName,
  businessName,
  branchName,
  userName,
  userEmail,
  workspaces,
  notifications,
}: WorkspaceShellLayoutProps) {
  return (
    <WorkspaceShellProvider
      workspaceName={workspaceName}
      workspaces={workspaces}
      initialNotifications={notifications}
    >
      <NavigationSidebarProvider defaultOpen={false} defaultCollapsed={false}>
        <WorkspaceShellFrame
          userName={userName}
          userEmail={userEmail}
          businessName={businessName}
          branchName={branchName}
        >
          {children}
        </WorkspaceShellFrame>
      </NavigationSidebarProvider>
    </WorkspaceShellProvider>
  );
}
