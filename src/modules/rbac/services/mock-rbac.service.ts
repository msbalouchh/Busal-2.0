import { SYSTEM_ROLE_SLUGS } from "@/modules/rbac/constants/system-roles";
import {
  DEFAULT_MOCK_RBAC_SELECTION,
  DEFAULT_MOCK_RBAC_USER_ID,
  MOCK_BRANCH_ASSIGNMENTS,
  MOCK_RBAC_PERMISSION_GROUPS,
  MOCK_RBAC_PERMISSIONS,
  MOCK_RBAC_ROLE_GROUPS,
  MOCK_RBAC_ROLES,
  MOCK_TENANT_ASSIGNMENTS,
  MOCK_USER_ROLE_ASSIGNMENTS,
  MOCK_WORKSPACE_ASSIGNMENTS,
} from "@/modules/rbac/constants/mock-rbac-data";
import { ACCESS_SCOPE_LEVELS } from "@/modules/rbac/types/access-scope";
import type { AccessScope } from "@/modules/rbac/types/access-scope";
import type { PermissionKey } from "@/modules/rbac/types/permission";
import type { RbacEngineContext, RbacSnapshot } from "@/modules/rbac/types/context";
import type { RoleSlug } from "@/modules/rbac/types/role";
import { normalizePermissionKeys } from "@/modules/rbac/utils/permission-utils";
import { createAuthorizationEngine } from "@/modules/rbac/utils/authorization-engine";

export interface RbacSelectionInput {
  userId?: string;
  tenantId?: string;
  workspaceId?: string;
  businessId?: string;
  branchId?: string;
}

function resolveRolePermissionKeys(
  roleSlugs: RoleSlug[],
  workspaceId: string | null,
): PermissionKey[] {
  const keys = new Set<PermissionKey>();

  for (const slug of roleSlugs) {
    const role = MOCK_RBAC_ROLES.find(
      (entry) =>
        entry.slug === slug && (entry.workspaceId === workspaceId || entry.workspaceId === null),
    );

    if (!role) {
      continue;
    }

    for (const key of role.permissionKeys) {
      keys.add(key);
    }
  }

  return Array.from(keys);
}

function resolveUserRoleSlugs(
  userId: string,
  selection: Required<
    Pick<RbacSelectionInput, "tenantId" | "workspaceId" | "businessId" | "branchId">
  >,
): RoleSlug[] {
  const roleSlugs = new Set<RoleSlug>();

  for (const assignment of MOCK_USER_ROLE_ASSIGNMENTS) {
    if (assignment.userId !== userId) {
      continue;
    }

    if (assignment.workspaceId && assignment.workspaceId !== selection.workspaceId) {
      continue;
    }

    roleSlugs.add(assignment.roleSlug);
  }

  for (const assignment of MOCK_BRANCH_ASSIGNMENTS) {
    if (assignment.userId !== userId || assignment.branchId !== selection.branchId) {
      continue;
    }

    roleSlugs.add(assignment.roleSlug);
  }

  for (const assignment of MOCK_WORKSPACE_ASSIGNMENTS) {
    if (assignment.userId !== userId || assignment.workspaceId !== selection.workspaceId) {
      continue;
    }

    roleSlugs.add(assignment.roleSlug);
  }

  for (const assignment of MOCK_TENANT_ASSIGNMENTS) {
    if (assignment.userId !== userId || assignment.tenantId !== selection.tenantId) {
      continue;
    }

    roleSlugs.add(assignment.roleSlug);
  }

  return Array.from(roleSlugs);
}

function resolveAccessScope(
  selection: Required<
    Pick<RbacSelectionInput, "tenantId" | "workspaceId" | "businessId" | "branchId">
  >,
  roleSlugs: RoleSlug[],
): AccessScope {
  const branchAssignment = MOCK_BRANCH_ASSIGNMENTS.find(
    (entry) => entry.branchId === selection.branchId,
  );
  const hasBranchRole = roleSlugs.some((slug) =>
    MOCK_BRANCH_ASSIGNMENTS.some(
      (entry) => entry.branchId === selection.branchId && entry.roleSlug === slug,
    ),
  );

  return {
    level: hasBranchRole ? ACCESS_SCOPE_LEVELS.BRANCH : ACCESS_SCOPE_LEVELS.WORKSPACE,
    tenantId: selection.tenantId,
    workspaceId: selection.workspaceId,
    businessId: selection.businessId,
    branchId: branchAssignment?.branchId ?? selection.branchId,
  };
}

export function buildRbacEngineContext(input: RbacSelectionInput = {}): RbacEngineContext {
  const userId = input.userId ?? DEFAULT_MOCK_RBAC_USER_ID;
  const selection = {
    tenantId: input.tenantId ?? DEFAULT_MOCK_RBAC_SELECTION.tenantId,
    workspaceId: input.workspaceId ?? DEFAULT_MOCK_RBAC_SELECTION.workspaceId,
    businessId: input.businessId ?? DEFAULT_MOCK_RBAC_SELECTION.businessId,
    branchId: input.branchId ?? DEFAULT_MOCK_RBAC_SELECTION.branchId,
  };

  const roleSlugs = resolveUserRoleSlugs(userId, selection);
  const isOwner = roleSlugs.includes(SYSTEM_ROLE_SLUGS.OWNER);
  const permissionKeys = normalizePermissionKeys(
    resolveRolePermissionKeys(roleSlugs, selection.workspaceId),
  );

  return {
    userId,
    tenantId: selection.tenantId,
    workspaceId: selection.workspaceId,
    businessId: selection.businessId,
    branchId: selection.branchId,
    roleSlugs,
    permissionKeys,
    accessScope: resolveAccessScope(selection, roleSlugs),
    isOwner,
  };
}

export function buildRbacSnapshot(input: RbacSelectionInput = {}): RbacSnapshot {
  const context = buildRbacEngineContext(input);

  return {
    permissions: MOCK_RBAC_PERMISSIONS,
    permissionGroups: MOCK_RBAC_PERMISSION_GROUPS,
    roles: MOCK_RBAC_ROLES.filter(
      (role) => !role.workspaceId || role.workspaceId === context.workspaceId,
    ),
    roleGroups: MOCK_RBAC_ROLE_GROUPS,
    userRoleAssignments: MOCK_USER_ROLE_ASSIGNMENTS.filter(
      (assignment) => assignment.userId === context.userId,
    ),
    tenantAssignments: MOCK_TENANT_ASSIGNMENTS.filter(
      (assignment) => assignment.userId === context.userId,
    ),
    workspaceAssignments: MOCK_WORKSPACE_ASSIGNMENTS.filter(
      (assignment) => assignment.userId === context.userId,
    ),
    branchAssignments: MOCK_BRANCH_ASSIGNMENTS.filter(
      (assignment) => assignment.userId === context.userId,
    ),
    context,
  };
}

export function getDefaultRbacSnapshot(): RbacSnapshot {
  return buildRbacSnapshot();
}

export function createRbacContextValue(input: RbacSelectionInput = {}) {
  const snapshot = buildRbacSnapshot(input);
  const engine = createAuthorizationEngine(snapshot.context);

  return {
    snapshot,
    ...engine,
    refresh: () => buildRbacSnapshot(input),
  };
}

export {
  MOCK_RBAC_PERMISSIONS,
  MOCK_RBAC_PERMISSION_GROUPS,
  MOCK_RBAC_ROLE_GROUPS,
  MOCK_RBAC_ROLES,
  MOCK_USER_ROLE_ASSIGNMENTS,
  MOCK_BRANCH_ASSIGNMENTS,
  MOCK_WORKSPACE_ASSIGNMENTS,
  MOCK_TENANT_ASSIGNMENTS,
  DEFAULT_MOCK_RBAC_USER_ID,
  DEFAULT_MOCK_RBAC_SELECTION,
};
