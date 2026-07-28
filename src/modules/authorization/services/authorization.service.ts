import "server-only";

import { prisma } from "@/lib/prisma";
import { resolveActiveBusinessForUser } from "@/modules/business-context/services/business-resolver.service";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId, isOnboardingCompleted } from "@/services/business-profile.service";
import { ensureSystemRoles } from "@/services/staff-management.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

import type {
  AuthorizationContext,
  PermissionCode,
  PermissionRecord,
} from "@/modules/authorization/types/authorization";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  normalizePermissionCodes,
} from "@/modules/authorization/utils/permission-utils";

export { hasAllPermissions, hasAnyPermission, hasPermission };

export async function listAllPermissionCodes(): Promise<PermissionCode[]> {
  const permissions = await prisma.permission.findMany({
    select: { code: true },
    orderBy: [{ module: "asc" }, { code: "asc" }],
  });

  return permissions.map((permission) => permission.code);
}

export async function getRolePermissions(
  roleId: string,
  businessId?: string,
): Promise<PermissionCode[]> {
  const role = await prisma.role.findFirst({
    where: {
      id: roleId,
      ...(businessId ? { businessId } : {}),
    },
    include: {
      rolePermissions: {
        include: {
          permission: { select: { code: true } },
        },
      },
    },
  });

  if (!role) {
    return [];
  }

  return role.rolePermissions.map((entry) => entry.permission.code);
}

async function getStaffPermissions(
  userId: string,
  businessId: string,
): Promise<{
  permissions: PermissionCode[];
  roleSlug: string | null;
}> {
  const staffMember = await prisma.staff.findFirst({
    where: {
      businessId,
      isActive: true,
      OR: [{ userId }, { user: { id: userId } }],
    },
    include: {
      staffRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: { select: { code: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!staffMember) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) {
      return { permissions: [], roleSlug: null };
    }

    const staffByEmail = await prisma.staff.findFirst({
      where: {
        businessId,
        email: { equals: user.email, mode: "insensitive" },
        isActive: true,
      },
      include: {
        staffRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: { select: { code: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!staffByEmail) {
      return { permissions: [], roleSlug: null };
    }

    return aggregateStaffPermissions(staffByEmail.staffRoles);
  }

  return aggregateStaffPermissions(staffMember.staffRoles);
}

function aggregateStaffPermissions(
  staffRoles: Array<{
    role: {
      slug: string;
      rolePermissions: Array<{ permission: { code: string } }>;
    };
  }>,
): { permissions: PermissionCode[]; roleSlug: string | null } {
  const permissions = new Set<PermissionCode>();
  let roleSlug: string | null = null;

  for (const assignment of staffRoles) {
    roleSlug = roleSlug ?? assignment.role.slug;

    for (const entry of assignment.role.rolePermissions) {
      permissions.add(entry.permission.code);
    }
  }

  return { permissions: Array.from(permissions), roleSlug };
}

export async function getUserPermissions(
  userId: string,
  businessId: string,
): Promise<PermissionCode[]> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { ownerId: true },
  });

  if (!business) {
    return [];
  }

  if (business.ownerId === userId) {
    return listAllPermissionCodes();
  }

  const staffAccess = await getStaffPermissions(userId, businessId);
  return staffAccess.permissions;
}

export async function resolveAuthorizationContext(
  user: AuthUser,
  business: BusinessProfileData & { id: string },
): Promise<AuthorizationContext> {
  await ensureSystemRoles(business.id);

  const isOwner = business.ownerId === user.id;

  if (isOwner) {
    const permissions = normalizePermissionCodes(await listAllPermissionCodes());

    return {
      user,
      business,
      permissions,
      roleSlug: "owner",
      isOwner: true,
    };
  }

  const staffAccess = await getStaffPermissions(user.id, business.id);

  return {
    user,
    business,
    permissions: normalizePermissionCodes(staffAccess.permissions),
    roleSlug: staffAccess.roleSlug,
    isOwner: false,
  };
}

export async function resolveBusinessForCurrentUser(): Promise<
  BusinessProfileData & { id: string }
> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  return resolveActiveBusinessForUser(user);
}

export async function buildAuthorizationContextForCurrentUser(): Promise<AuthorizationContext> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const business = await resolveBusinessForCurrentUser();
  return resolveAuthorizationContext(user, business);
}

export async function buildAuthorizationContextForUser(
  userId: string,
): Promise<AuthorizationContext | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return null;
  }

  const business = await getBusinessByOwnerId(userId);

  if (!business) {
    return null;
  }

  return resolveAuthorizationContext(
    {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as AuthUser["role"],
      tenantId: null,
    },
    business,
  );
}

export async function isBusinessActive(businessId: string): Promise<boolean> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, onboardingCompleted: true },
  });

  return Boolean(business?.onboardingCompleted);
}

export async function assertBusinessAccess(userId: string, businessId: string): Promise<void> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { ownerId: true },
  });

  if (!business) {
    return;
  }

  if (business.ownerId === userId) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user?.email) {
    return;
  }

  const staffMember = await prisma.staff.findFirst({
    where: {
      businessId,
      email: user.email,
      isActive: true,
    },
    select: { id: true },
  });

  if (!staffMember) {
    throw new Error("Business access denied");
  }
}

export async function userHasCompletedOnboarding(userId: string): Promise<boolean> {
  return isOnboardingCompleted(userId);
}

export async function getPermissionCatalog(): Promise<PermissionRecord[]> {
  return prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { name: "asc" }],
  });
}

export async function getRolePermissionsBySlug(
  businessId: string,
  roleSlug: string,
): Promise<PermissionCode[]> {
  const role = await prisma.role.findFirst({
    where: { businessId, slug: roleSlug },
    select: { id: true },
  });

  if (!role) {
    return [];
  }

  return getRolePermissions(role.id, businessId);
}
