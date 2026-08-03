"use client";

import { useWorkspaceShellContext } from "@/modules/application-shell/providers/workspace-shell-provider";

export function useWorkspaceShell() {
  return useWorkspaceShellContext();
}

export function useWorkspaceNavigation() {
  const { workspaceName, activeWorkspaceId, workspaces, switchWorkspace } =
    useWorkspaceShellContext();

  return {
    workspaceName,
    activeWorkspaceId,
    workspaces,
    switchWorkspace,
  };
}
