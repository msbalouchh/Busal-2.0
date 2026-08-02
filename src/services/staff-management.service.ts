import "server-only";

import { prisma } from "@/lib/prisma";
import { SYSTEM_ROLE_DEFINITIONS } from "@/modules/staff/constants/system-roles";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import {
  ensureMainBranch,
  listBranches,
  type BranchData,
} from "@/services/business-management.service";
import type { BusinessProfileData } from "@/types/business-profile";

export interface StaffData {
  id: string;
  businessId: string;
  branchId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  branch: { id: string; name: string } | null;
  roles: { id: string; name: string; slug: string; isSystem: boolean }[];
}

export interface RoleData {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  isArchived: boolean;
  permissionCount: number;
  staffCount: number;
}

export interface PermissionData {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string;
}

export interface RolePermissionMatrix {
  roles: RoleData[];
  permissions: PermissionData[];
  assignments: Record<string, string[]>;
}

export interface StaffInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  branchId?: string | null;
  roleId?: string | null;
  isActive?: boolean;
}

export interface RoleInput {
  name: string;
  description?: string;
}

export interface PermissionAssignmentInput {
  roleId: string;
  permissionIds: string[];
}

async function getOwnedBusiness(ownerId: string): Promise<BusinessProfileData & { id: string }> {
  return getOrCreateBusinessForOwner(ownerId);
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function resolvePermissionIds(keys: string[] | "all"): Promise<string[]> {
  const permissions = await prisma.permission.findMany();

  if (keys === "all") {
    return permissions.map((permission) => permission.id);
  }

  const codeSet = new Set(keys);
  return permissions
    .filter((permission) => codeSet.has(permission.code))
    .map((permission) => permission.id);
}

async function assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void> {
  await prisma.rolePermission.deleteMany({ where: { roleId } });

  if (permissionIds.length === 0) {
    return;
  }

  await prisma.rolePermission.createMany({
    data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
    skipDuplicates: true,
  });
}

export async function ensureSystemRoles(businessId: string): Promise<void> {
  for (const definition of SYSTEM_ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: { businessId_slug: { businessId, slug: definition.slug } },
      create: {
        businessId,
        name: definition.name,
        slug: definition.slug,
        description: definition.description,
        isSystem: true,
      },
      update: {},
    });

    const permissionCount = await prisma.rolePermission.count({
      where: { roleId: role.id },
    });

    if (permissionCount === 0) {
      const permissionIds = await resolvePermissionIds(definition.permissionKeys);
      await assignPermissionsToRole(role.id, permissionIds);
    }
  }
}

export async function getStaffManagementContext(ownerId: string, branchId: string | null = null) {
  const business = await getOwnedBusiness(ownerId);
  await ensureMainBranch(business.id);
  await ensureSystemRoles(business.id);

  const [members, roles, permissions, branches, assignments] = await Promise.all([
    listStaffMembers(business.id, branchId),
    listRoles(business.id),
    listPermissions(),
    listBranches(business.id),
    getRolePermissionAssignments(business.id),
  ]);

  return {
    business,
    members,
    roles,
    permissions,
    branches,
    permissionMatrix: {
      roles,
      permissions,
      assignments,
    } satisfies RolePermissionMatrix,
  };
}

export async function listStaffMembers(
  businessId: string,
  branchId: string | null = null,
): Promise<StaffData[]> {
  const staff = await prisma.staff.findMany({
    where: {
      businessId,
      ...(branchId ? { branchId } : {}),
    },
    include: {
      branch: { select: { id: true, name: true } },
      staffRoles: {
        include: {
          role: { select: { id: true, name: true, slug: true, isSystem: true } },
        },
      },
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });

  return staff.map((member) => ({
    id: member.id,
    businessId: member.businessId,
    branchId: member.branchId,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone,
    isActive: member.isActive,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
    branch: member.branch,
    roles: member.staffRoles.map((staffRole) => staffRole.role),
  }));
}

export async function listRoles(businessId: string): Promise<RoleData[]> {
  const roles = await prisma.role.findMany({
    where: { businessId },
    include: {
      _count: {
        select: {
          rolePermissions: true,
          staffRoles: true,
        },
      },
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  return roles.map((role) => ({
    id: role.id,
    businessId: role.businessId,
    name: role.name,
    slug: role.slug,
    description: role.description,
    isSystem: role.isSystem,
    isArchived: role.isArchived,
    permissionCount: role._count.rolePermissions,
    staffCount: role._count.staffRoles,
  }));
}

export async function listPermissions(): Promise<PermissionData[]> {
  return prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { name: "asc" }],
  });
}

export async function getRolePermissionAssignments(
  businessId: string,
): Promise<Record<string, string[]>> {
  const roles = await prisma.role.findMany({
    where: { businessId },
    include: {
      rolePermissions: { select: { permissionId: true } },
    },
  });

  return Object.fromEntries(
    roles.map((role) => [role.id, role.rolePermissions.map((entry) => entry.permissionId)]),
  );
}

async function assertBranchBelongsToBusiness(
  businessId: string,
  branchId: string | null | undefined,
): Promise<void> {
  if (!branchId) {
    return;
  }

  const branch = await prisma.branch.findFirst({
    where: { id: branchId, businessId },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }
}

async function assertRoleBelongsToBusiness(
  businessId: string,
  roleId: string | null | undefined,
): Promise<void> {
  if (!roleId) {
    return;
  }

  const role = await prisma.role.findFirst({
    where: { id: roleId, businessId },
  });

  if (!role) {
    throw new Error("Role not found");
  }
}

async function syncStaffRole(staffId: string, roleId: string | null | undefined): Promise<void> {
  await prisma.staffRole.deleteMany({ where: { staffId } });

  if (!roleId) {
    return;
  }

  await prisma.staffRole.create({
    data: { staffId, roleId },
  });
}

export async function createStaffMember(ownerId: string, input: StaffInput): Promise<StaffData> {
  const business = await getOwnedBusiness(ownerId);
  await assertBranchBelongsToBusiness(business.id, input.branchId);
  await assertRoleBelongsToBusiness(business.id, input.roleId);

  const member = await prisma.staff.create({
    data: {
      businessId: business.id,
      branchId: input.branchId ?? null,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      isActive: input.isActive ?? true,
    },
  });

  await syncStaffRole(member.id, input.roleId);

  const members = await listStaffMembers(business.id);
  const created = members.find((entry) => entry.id === member.id);

  if (!created) {
    throw new Error("Failed to create staff member");
  }

  return created;
}

export async function updateStaffMember(
  ownerId: string,
  staffId: string,
  input: StaffInput,
): Promise<StaffData> {
  const business = await getOwnedBusiness(ownerId);
  const member = await prisma.staff.findFirst({
    where: { id: staffId, businessId: business.id },
  });

  if (!member) {
    throw new Error("Staff member not found");
  }

  await assertBranchBelongsToBusiness(business.id, input.branchId);
  await assertRoleBelongsToBusiness(business.id, input.roleId);

  await prisma.staff.update({
    where: { id: staffId },
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      branchId: input.branchId ?? null,
      isActive: input.isActive ?? member.isActive,
    },
  });

  if (input.roleId !== undefined) {
    await syncStaffRole(staffId, input.roleId);
  }

  const members = await listStaffMembers(business.id);
  const updated = members.find((entry) => entry.id === staffId);

  if (!updated) {
    throw new Error("Failed to update staff member");
  }

  return updated;
}

export async function deleteStaffMember(ownerId: string, staffId: string): Promise<void> {
  const business = await getOwnedBusiness(ownerId);
  const member = await prisma.staff.findFirst({
    where: { id: staffId, businessId: business.id },
  });

  if (!member) {
    throw new Error("Staff member not found");
  }

  await prisma.staff.delete({ where: { id: staffId } });
}

export async function setStaffActiveStatus(
  ownerId: string,
  staffId: string,
  isActive: boolean,
): Promise<void> {
  const business = await getOwnedBusiness(ownerId);
  const member = await prisma.staff.findFirst({
    where: { id: staffId, businessId: business.id },
  });

  if (!member) {
    throw new Error("Staff member not found");
  }

  await prisma.staff.update({
    where: { id: staffId },
    data: { isActive },
  });
}

export async function createCustomRole(ownerId: string, input: RoleInput): Promise<RoleData> {
  const business = await getOwnedBusiness(ownerId);
  const name = input.name.trim();

  if (!name) {
    throw new Error("Role name is required");
  }

  const baseSlug = slugify(name);
  let slug = baseSlug;
  let attempt = 1;

  while (
    await prisma.role.findUnique({ where: { businessId_slug: { businessId: business.id, slug } } })
  ) {
    slug = `${baseSlug}-${attempt}`;
    attempt += 1;
  }

  await prisma.role.create({
    data: {
      businessId: business.id,
      name,
      slug,
      description: input.description?.trim() || null,
      isSystem: false,
    },
  });

  const roles = await listRoles(business.id);
  const created = roles.find((role) => role.slug === slug);

  if (!created) {
    throw new Error("Failed to create role");
  }

  return created;
}

export async function updateCustomRole(
  ownerId: string,
  roleId: string,
  input: RoleInput,
): Promise<RoleData> {
  const business = await getOwnedBusiness(ownerId);
  const role = await prisma.role.findFirst({
    where: { id: roleId, businessId: business.id },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  if (role.isSystem) {
    throw new Error("System roles cannot be edited");
  }

  const name = input.name.trim();

  if (!name) {
    throw new Error("Role name is required");
  }

  await prisma.role.update({
    where: { id: roleId },
    data: {
      name,
      description: input.description?.trim() || null,
    },
  });

  const roles = await listRoles(business.id);
  const updated = roles.find((entry) => entry.id === roleId);

  if (!updated) {
    throw new Error("Failed to update role");
  }

  return updated;
}

export async function deleteCustomRole(ownerId: string, roleId: string): Promise<void> {
  const business = await getOwnedBusiness(ownerId);
  const role = await prisma.role.findFirst({
    where: { id: roleId, businessId: business.id },
    include: {
      _count: { select: { staffRoles: true, memberRoles: true } },
    },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  if (role.isSystem) {
    throw new Error("System roles cannot be deleted");
  }

  if (role._count.staffRoles > 0 || role._count.memberRoles > 0) {
    throw new Error("Cannot delete a role assigned to staff or members");
  }

  await prisma.role.delete({ where: { id: roleId } });
}

export async function saveRolePermissions(
  ownerId: string,
  assignments: PermissionAssignmentInput[],
): Promise<void> {
  const business = await getOwnedBusiness(ownerId);
  const roles = await prisma.role.findMany({
    where: { businessId: business.id },
    select: { id: true },
  });
  const roleIds = new Set(roles.map((role) => role.id));

  for (const assignment of assignments) {
    if (!roleIds.has(assignment.roleId)) {
      throw new Error("Role not found");
    }

    const validPermissions = await prisma.permission.findMany({
      where: { id: { in: assignment.permissionIds } },
      select: { id: true },
    });

    await assignPermissionsToRole(
      assignment.roleId,
      validPermissions.map((permission) => permission.id),
    );
  }
}

export type { BranchData };
