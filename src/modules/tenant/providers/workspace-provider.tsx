"use client";

import type { ReactNode } from "react";

import { useWorkspaceContext } from "@/modules/tenant/hooks/use-workspace";

interface WorkspaceProviderProps {
  children: ReactNode;
}

/**
 * Semantic workspace scope.
 * Requires TenantProvider above the tree.
 */
export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  useWorkspaceContext();
  return children;
}
