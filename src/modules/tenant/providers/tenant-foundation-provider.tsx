"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { BranchContext } from "@/modules/tenant/contexts/branch-context";
import { BusinessContext } from "@/modules/tenant/contexts/business-context";
import { OrganizationContext } from "@/modules/tenant/contexts/organization-context";
import { TenantContext } from "@/modules/tenant/contexts/tenant-context";
import { TenantFoundationContext } from "@/modules/tenant/contexts/tenant-foundation-context";
import { WorkspaceContext } from "@/modules/tenant/contexts/workspace-context";
import {
  buildTenantSnapshot,
  getDefaultTenantSnapshot,
  selectBranch,
  selectBusiness,
  selectOrganization,
  selectTenant,
  selectWorkspace,
} from "@/modules/tenant/services/mock-tenant.service";
import type { TenantSelection } from "@/modules/tenant/types/entities";
import type { TenantFoundationContextValue } from "@/modules/tenant/types/context";
import { hasPermissionKey } from "@/modules/tenant/utils/tenant-selectors";

interface TenantFoundationProviderProps {
  children: ReactNode;
  initialSelection?: TenantSelection;
}

export function TenantFoundationProvider({
  children,
  initialSelection,
}: TenantFoundationProviderProps) {
  const [selection, setSelection] = useState<TenantSelection>(
    () => initialSelection ?? getDefaultTenantSnapshot().selection,
  );

  const snapshot = useMemo(() => buildTenantSnapshot(selection), [selection]);

  const switchTenant = useCallback((tenantId: string) => {
    setSelection(selectTenant(tenantId));
  }, []);

  const switchOrganization = useCallback((organizationId: string) => {
    setSelection(selectOrganization(organizationId));
  }, []);

  const switchWorkspace = useCallback((workspaceId: string) => {
    setSelection(selectWorkspace(workspaceId));
  }, []);

  const switchBusiness = useCallback((businessId: string) => {
    setSelection(selectBusiness(businessId));
  }, []);

  const switchBranch = useCallback((branchId: string) => {
    setSelection((current) => selectBranch(branchId, current));
  }, []);

  const hasPermission = useCallback(
    (permissionKey: string) => {
      const ownerOrStaff = snapshot.staff[0];
      if (!ownerOrStaff) {
        return false;
      }

      return hasPermissionKey(ownerOrStaff.permissionKeys, permissionKey);
    },
    [snapshot.staff],
  );

  const value = useMemo<TenantFoundationContextValue>(
    () => ({
      tenant: snapshot.tenant,
      organization: snapshot.organization,
      workspace: snapshot.workspace,
      business: snapshot.business,
      branch: snapshot.branch,
      organizations: snapshot.organizations,
      workspaces: snapshot.workspaces,
      businesses: snapshot.businesses,
      branches: snapshot.branches,
      staff: snapshot.staff,
      roles: snapshot.roles,
      permissions: snapshot.permissions,
      selection: snapshot.selection,
      switchTenant,
      switchOrganization,
      switchWorkspace,
      switchBusiness,
      switchBranch,
      hasPermission,
      snapshot,
    }),
    [
      snapshot,
      switchTenant,
      switchOrganization,
      switchWorkspace,
      switchBusiness,
      switchBranch,
      hasPermission,
    ],
  );

  const tenantValue = useMemo(
    () => ({
      tenant: value.tenant,
      organizations: value.organizations,
      workspaces: value.workspaces,
      businesses: value.businesses,
      selection: value.selection,
      switchTenant: value.switchTenant,
    }),
    [value],
  );

  const organizationValue = useMemo(
    () => ({
      organization: value.organization,
      organizations: value.organizations,
      switchOrganization: value.switchOrganization,
    }),
    [value],
  );

  const workspaceValue = useMemo(
    () => ({
      workspace: value.workspace,
      workspaces: value.workspaces,
      switchWorkspace: value.switchWorkspace,
    }),
    [value],
  );

  const businessValue = useMemo(
    () => ({
      business: value.business,
      businesses: value.businesses,
      switchBusiness: value.switchBusiness,
    }),
    [value],
  );

  const branchValue = useMemo(
    () => ({
      branch: value.branch,
      branches: value.branches,
      switchBranch: value.switchBranch,
    }),
    [value],
  );

  return (
    <TenantFoundationContext.Provider value={value}>
      <TenantContext.Provider value={tenantValue}>
        <OrganizationContext.Provider value={organizationValue}>
          <WorkspaceContext.Provider value={workspaceValue}>
            <BusinessContext.Provider value={businessValue}>
              <BranchContext.Provider value={branchValue}>{children}</BranchContext.Provider>
            </BusinessContext.Provider>
          </WorkspaceContext.Provider>
        </OrganizationContext.Provider>
      </TenantContext.Provider>
    </TenantFoundationContext.Provider>
  );
}
