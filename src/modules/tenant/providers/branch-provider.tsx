"use client";

import type { ReactNode } from "react";

import { useBranchContext } from "@/modules/tenant/hooks/use-branch";

interface BranchProviderProps {
  children: ReactNode;
}

/**
 * Semantic branch scope.
 * Requires TenantProvider above the tree.
 */
export function BranchProvider({ children }: BranchProviderProps) {
  useBranchContext();
  return children;
}
