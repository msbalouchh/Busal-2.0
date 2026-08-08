import "server-only";

import { prisma } from "@/lib/prisma";
import { buildAuthorizationContextForUser } from "@/modules/authorization/services/authorization.service";
import {
  ALL_RBAC_PERMISSION_KEYS,
  RBAC_PERMISSION_CATALOG,
} from "@/modules/rbac/constants/permission-catalog";
import { RBAC_PERMISSION_GROUPS } from "@/modules/rbac/constants/permission-groups";
import { RBAC_ROLE_GROUPS } from "@/modules/rbac/constants/role-groups";
import { SYSTEM_ROLE_SLUGS } from "@/modules/rbac/constants/system-roles";
import { ACCESS_SCOPE_LEVELS } from "@/modules/rbac/types/access-scope";
import type { AccessScope } from "@/modules/rbac/types/access-scope";
import type { PermissionKey } from "@/modules/rbac/types/permission";
import type { RoleSlug } from "@/modules/rbac/types/role";
import type { RbacEngineContext, RbacSnapshot } from "@/modules/rbac/types/context";
import { normalizePermissionKeys } from "@/modules/rbac/utils/permission-utils";
import { PERMISSION_TYPES } from "@/modules/rbac/constants/permission-types";

export interface RbacFoundationInput {
  userId: string;
  businessId: string;
  branchId?: string | null;
}

function mapAuthCodeToPermissionKey(code: string): PermissionKey | null {
  const [category, action] = code.split(".");
  if (!category || !action) {
    return null;
  }

  const actionMap: Record<string, string> = {
    view: PERMISSION_TYPES.READ,
    read: PERMISSION_TYPES.READ,
    create: PERMISSION_TYPES.CREATE,
    update: PERMISSION_TYPES.UPDATE,
    delete: PERMISSION_TYPES.DELETE,
    manage: PERMISSION_TYPES.MANAGE,
    configure: PERMISSION_TYPES.CONFIGURE,
    export: PERMISSION_TYPES.EXPORT,
    import: PERMISSION_TYPES.EXPORT,
    publish: PERMISSION_TYPES.APPROVE,
    approve: PERMISSION_TYPES.APPROVE,
    assign: PERMISSION_TYPES.ASSIGN,
    invite: PERMISSION_TYPES.INVITE,
    assign_role: PERMISSION_TYPES.ASSIGN,
    assign_branch: PERMISSION_TYPES.ASSIGN,
  };

  const type = actionMap[action] ?? action;
  const key = `${category}.${type}` as PermissionKey;
  return ALL_RBAC_PERMISSION_KEYS.includes(key) ? key : null;
}

function resolvePermissionKeys(
  isOwner: boolean,
  authPermissions: Iterable<string>,
): ReadonlySet<PermissionKey> {
  if (isOwner) {
    return normalizePermissionKeys(ALL_RBAC_PERMISSION_KEYS);
  }

  const keys = new Set<PermissionKey>();
  for (const code of authPermissions) {
    const mapped = mapAuthCodeToPermissionKey(code);
    if (mapped) {
      keys.add(mapped);
    }
  }

  return normalizePermissionKeys(Array.from(keys));
}

function buildHierarchyIds(businessId: string) {
  return {
    tenantId: businessId,
    organizationId: `${businessId}-org`,
    workspaceId: `${businessId}-ws`,
    businessId,
  };
}

function resolveAccessScope(
  businessId: string,
  branchId: string | null,
): AccessScope {
  const ids = buildHierarchyIds(businessId);
  return {
    level: branchId ? ACCESS_SCOPE_LEVELS.BRANCH : ACCESS_SCOPE_LEVELS.WORKSPACE,
    tenantId: ids.tenantId,
    workspaceId: ids.workspaceId,
    businessId: ids.businessId,
    branchId,
  };
}

/** Production RBAC snapshot hydrated from authorization + role data. */
export async function buildRbacFoundationSnapshot(
  input: RbacFoundationInput,
): Promise<RbacSnapshot> {
  const authorization = await buildAuthorizationContextForUser(input.userId);

  if (!authorization) {
    throw new Error("Unable to resolve authorization context for RBAC snapshot");
  }

  const ids = buildHierarchyIds(input.businessId);
  const branchId = input.branchId ?? null;
  const roleSlug = (authorization.roleSlug ?? "staff") as RoleSlug;
  const roleSlugs: RoleSlug[] = authorization.isOwner
    ? [SYSTEM_ROLE_SLUGS.OWNER]
    : [roleSlug];
  const permissionKeys = resolvePermissionKeys(
    authorization.isOwner,
    authorization.permissions,
  );

  const context: RbacEngineContext = {
    userId: input.userId,
    tenantId: ids.tenantId,
    workspaceId: ids.workspaceId,
    businessId: ids.businessId,
    branchId,
    roleSlugs,
    permissionKeys,
    accessScope: resolveAccessScope(input.businessId, branchId),
    isOwner: authorization.isOwner,
  };

  const [dbRoles, staffRows] = await Promise.all([
    prisma.role.findMany({
      where: { businessId: input.businessId },
      include: {
        rolePermissions: {
          include: { permission: { select: { code: true } } },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.staff.findMany({
      where: { businessId: input.businessId, isActive: true },
      select: { id: true, userId: true, branchId: true },
      take: 100,
    }),
  ]);

  const roles = dbRoles.map((role) => ({
    id: role.id,
    slug: role.slug as RoleSlug,
    name: role.name,
    description: role.description ?? "",
    permissionKeys: normalizePermissionKeys(
      role.rolePermissions
        .map((entry) => mapAuthCodeToPermissionKey(entry.permission.code))
        .filter((key): key is PermissionKey => key !== null),
    ) as unknown as PermissionKey[],
    isSystem: role.isSystem,
    priority: role.isSystem ? 0 : 100,
    tenantId: ids.tenantId,
    workspaceId: ids.workspaceId,
    businessId: ids.businessId,
  }));

  if (roles.length === 0 && authorization.isOwner) {
    roles.push({
      id: `${ids.workspaceId}-owner`,
      slug: SYSTEM_ROLE_SLUGS.OWNER,
      name: "Owner",
      description: "Business owner",
      permissionKeys: ALL_RBAC_PERMISSION_KEYS,
      isSystem: true,
      priority: 0,
      tenantId: ids.tenantId,
      workspaceId: ids.workspaceId,
      businessId: ids.businessId,
    });
  }

  const userRoleAssignments = staffRows
    .filter((staff) => staff.userId === input.userId)
    .map((staff) => ({
      id: staff.id,
      userId: input.userId,
      roleId: roles[0]?.id ?? `${ids.workspaceId}-owner`,
      roleSlug: roleSlugs[0] ?? "viewer",
      scope: branchId ? ACCESS_SCOPE_LEVELS.BRANCH : ACCESS_SCOPE_LEVELS.WORKSPACE,
      tenantId: ids.tenantId,
      workspaceId: ids.workspaceId,
      businessId: ids.businessId,
      branchId: staff.branchId,
      assignedBy: null,
      assignedAt: new Date().toISOString(),
    }));

  return {
    permissions: RBAC_PERMISSION_CATALOG,
    permissionGroups: RBAC_PERMISSION_GROUPS,
    roles,
    roleGroups: RBAC_ROLE_GROUPS,
    userRoleAssignments,
    tenantAssignments: authorization.isOwner
      ? [
          {
            id: `${input.userId}-tenant`,
            userId: input.userId,
            tenantId: ids.tenantId,
            roleSlug: SYSTEM_ROLE_SLUGS.OWNER,
            assignedAt: new Date().toISOString(),
          },
        ]
      : [],
    workspaceAssignments: [
      {
        id: `${input.userId}-workspace`,
        userId: input.userId,
        tenantId: ids.tenantId,
        workspaceId: ids.workspaceId,
        roleSlug: roleSlugs[0] ?? "staff",
        assignedAt: new Date().toISOString(),
      },
    ],
    branchAssignments: branchId
      ? [
          {
            id: `${input.userId}-branch`,
            userId: input.userId,
            tenantId: ids.tenantId,
            workspaceId: ids.workspaceId,
            businessId: ids.businessId,
            branchId,
            roleSlug: roleSlugs[0] ?? "staff",
            assignedAt: new Date().toISOString(),
          },
        ]
      : [],
    context,
  };
}
