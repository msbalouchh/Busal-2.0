"use client";

import { useContext } from "react";

import { WorkspaceContext } from "@/modules/tenant/contexts/workspace-context";
import type { WorkspaceContextValue } from "@/modules/tenant/types/context";

export function useWorkspaceContext(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used within TenantProvider");
  }

  return context;
}

export function useWorkspace(): WorkspaceContextValue {
  return useWorkspaceContext();
}
