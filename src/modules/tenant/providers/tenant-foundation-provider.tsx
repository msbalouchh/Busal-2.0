"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { BranchContext } from "@/modules/tenant/contexts/branch-context";
import { BusinessContext } from "@/modules/tenant/contexts/business-context";
import { OrganizationContext } from "@/modules/tenant/contexts/organization-context";
import { TenantContext } from "@/modules/tenant/contexts/tenant-context";
import { TenantFoundationContext } from "@/modules/tenant/contexts/tenant-foundation-context";
import { WorkspaceContext } from "@/modules/tenant/contexts/workspace-context";
import type { TenantSelection } from "@/modules/tenant/types/entities";
import type { TenantFoundationContextValue, TenantSnapshot } from "@/modules/tenant/types/context";
import { hasPermissionKey } from "@/modules/tenant/utils/tenant-selectors";

interface TenantFoundationProviderProps {
  children: ReactNode;
  initialSnapshot: TenantSnapshot;
}

function buildSelectionFromSnapshot(
  snapshot: TenantSnapshot,
  branchId?: string,
): TenantSelection {
  return {
    tenantId: snapshot.tenant.id,
    organizationId: snapshot.organization.id,
    workspaceId: snapshot.workspace.id,
    businessId: snapshot.business.id,
    branchId: branchId ?? snapshot.branch.id,
  };
}

export function TenantFoundationProvider({
  children,
  initialSnapshot,
}: TenantFoundationProviderProps) {
  const [snapshot, setSnapshot] = useState<TenantSnapshot>(initialSnapshot);
  const [selection, setSelection] = useState<TenantSelection>(() =>
    buildSelectionFromSnapshot(initialSnapshot),
  );

  const refreshSnapshot = useCallback(async () => {
    const response = await fetch("/api/tenant/snapshot");
    if (!response.ok) {
      return;
    }

    const nextSnapshot = (await response.json()) as TenantSnapshot;
    setSnapshot(nextSnapshot);
    setSelection(buildSelectionFromSnapshot(nextSnapshot));
  }, []);

  const switchTenant = useCallback(
    (tenantId: string) => {
      if (snapshot.tenant.id !== tenantId) {
        void refreshSnapshot();
        return;
      }

      setSelection((current) => ({ ...current, tenantId }));
    },
    [refreshSnapshot, snapshot.tenant.id],
  );

  const switchOrganization = useCallback((organizationId: string) => {
    setSelection((current) => ({ ...current, organizationId }));
  }, []);

  const switchWorkspace = useCallback((workspaceId: string) => {
    setSelection((current) => ({ ...current, workspaceId }));
  }, []);

  const switchBusiness = useCallback(
    (businessId: string) => {
      void refreshSnapshot();
      setSelection((current) => ({ ...current, businessId }));
    },
    [refreshSnapshot],
  );

  const switchBranch = useCallback((branchId: string) => {
    setSelection((current) => ({ ...current, branchId }));
    setSnapshot((current) => {
      const branch = current.branches.find((entry) => entry.id === branchId) ?? current.branch;
      return { ...current, branch };
    });
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
      selection,
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
      selection,
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
