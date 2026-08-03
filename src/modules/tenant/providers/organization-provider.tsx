"use client";

import type { ReactNode } from "react";

import { useOrganizationContext } from "@/modules/tenant/hooks/use-organization";

interface OrganizationProviderProps {
  children: ReactNode;
}

/**
 * Semantic organization scope.
 * Requires TenantProvider above the tree.
 */
export function OrganizationProvider({ children }: OrganizationProviderProps) {
  useOrganizationContext();
  return children;
}
