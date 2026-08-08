"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type {
  WorkspaceNotification,
  WorkspaceShellContextValue,
  WorkspaceSummary,
} from "@/modules/application-shell/types/workspace-shell.types";

const WorkspaceShellContext = createContext<WorkspaceShellContextValue | null>(null);

interface WorkspaceShellProviderProps {
  children: ReactNode;
  workspaceName?: string;
  workspaces?: WorkspaceSummary[];
  initialNotifications?: WorkspaceNotification[];
}

export function WorkspaceShellProvider({
  children,
  workspaceName = "Workspace",
  workspaces = [],
  initialNotifications = [],
}: WorkspaceShellProviderProps) {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(
    () => workspaces.find((workspace) => workspace.isActive)?.id ?? workspaces[0]?.id ?? "",
  );
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId);
  const resolvedWorkspaceName = activeWorkspace?.name ?? workspaceName;

  const switchWorkspace = useCallback((workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  }, []);

  const value = useMemo<WorkspaceShellContextValue>(
    () => ({
      workspaceName: resolvedWorkspaceName,
      workspaces,
      activeWorkspaceId,
      switchWorkspace,
      isRightDrawerOpen,
      openRightDrawer: () => setIsRightDrawerOpen(true),
      closeRightDrawer: () => setIsRightDrawerOpen(false),
      isNotificationCenterOpen,
      openNotificationCenter: () => setIsNotificationCenterOpen(true),
      closeNotificationCenter: () => setIsNotificationCenterOpen(false),
      notifications,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [
      resolvedWorkspaceName,
      workspaces,
      activeWorkspaceId,
      switchWorkspace,
      isRightDrawerOpen,
      isNotificationCenterOpen,
      notifications,
      markNotificationRead,
      markAllNotificationsRead,
    ],
  );

  return <WorkspaceShellContext.Provider value={value}>{children}</WorkspaceShellContext.Provider>;
}

export function useWorkspaceShellContext(): WorkspaceShellContextValue {
  const context = useContext(WorkspaceShellContext);

  if (!context) {
    throw new Error("useWorkspaceShellContext must be used within WorkspaceShellProvider");
  }

  return context;
}
