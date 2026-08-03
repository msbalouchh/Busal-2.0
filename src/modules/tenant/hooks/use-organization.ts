"use client";

import { useContext } from "react";

import { OrganizationContext } from "@/modules/tenant/contexts/organization-context";
import type { OrganizationContextValue } from "@/modules/tenant/types/context";

export function useOrganizationContext(): OrganizationContextValue {
  const context = useContext(OrganizationContext);

  if (!context) {
    throw new Error("useOrganization must be used within TenantProvider");
  }

  return context;
}

export function useOrganization(): OrganizationContextValue {
  return useOrganizationContext();
}
