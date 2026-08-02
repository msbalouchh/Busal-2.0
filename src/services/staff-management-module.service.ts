import "server-only";

import { createHash, randomBytes } from "node:crypto";

import type { Prisma, StaffAccountStatus, StaffAuditEventType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import {
  STAFF_DIRECTORY_PAGE_SIZE,
  STAFF_INVITATION_EXPIRY_DAYS,
} from "@/modules/staff/constants/staff-management";
import { mergeStaffProfile, parseStaffProfile } from "@/modules/staff/utils/staff-profile";
import type {
  BulkInviteInput,
  BulkStaffUpdateInput,
  SerializedStaffMember,
  StaffAuditEntry,
  StaffDirectoryQuery,
  StaffDirectoryResult,
  StaffInvitationData,
  StaffInvitationInput,
  StaffManagementBundle,
  StaffManagementPermissions,
  StaffProfileInput,
} from "@/modules/staff/types/staff-management-types";
import { publishNotificationEvent } from "@/services/notifications.service";
import {
  ensureSystemRoles,
  getRolePermissionAssignments,
  listPermissions,
  listRoles,
  saveRolePermissions,
  type PermissionAssignmentInput,
  type RoleInput,
} from "@/services/staff-management.service";
import { ensureMainBranch, listBranches } from "@/services/business-management.service";
import { listIamSessions } from "@/services/iam.service";

function buildPermissions(platform: BusinessContext): StaffManagementPermissions {
  const permissions = platform.authorization.permissions;

  return {
    canView: platform.isOwner || hasPermission(permissions, PERMISSION_CODES.STAFF_VIEW),
    canCreate: platform.isOwner || hasPermission(permissions, PERMISSION_CODES.STAFF_CREATE),
    canUpdate: platform.isOwner || hasPermission(permissions, PERMISSION_CODES.STAFF_UPDATE),
    canDelete: platform.isOwner || hasPermission(permissions, PERMISSION_CODES.STAFF_DELETE),
    canManageRoles:
      platform.isOwner ||
      hasPermission(permissions, PERMISSION_CODES.STAFF_ASSIGN_ROLE) ||
      hasPermission(permissions, PERMISSION_CODES.STAFF_UPDATE) ||
      hasPermission(permissions, PERMISSION_CODES.STAFF_CREATE),
    canManagePermissions:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.STAFF_UPDATE),
    canInvite: platform.isOwner || hasPermission(permissions, PERMISSION_CODES.STAFF_CREATE),
    canManageSecurity:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.STAFF_UPDATE),
  };
}

async function logStaffAudit(
  businessId: string,
  eventType: StaffAuditEventType,
  options: {
    staffId?: string | null;
    actorUserId?: string | null;
    actorStaffId?: string | null;
    metadata?: Record<string, unknown>;
  } = {},
): Promise<void> {
  await prisma.staffAuditLog.create({
    data: {
      businessId,
      staffId: options.staffId ?? null,
      eventType,
      actorUserId: options.actorUserId ?? null,
      actorStaffId: options.actorStaffId ?? null,
      metadata: options.metadata ? (options.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

async function serializeStaffMember(
  businessId: string,
  member: Prisma.StaffGetPayload<{
    include: {
      branch: { select: { id: true; name: true } };
      staffRoles: {
        include: { role: { select: { id: true; name: true; slug: true; isSystem: true } } };
      };
      branchAssignments: { include: { branch: { select: { id: true; name: true } } } };
      user: { select: { id: true } };
    };
  }>,
): Promise<SerializedStaffMember> {
  let mfaEnabled = false;
  let activeSessionCount = 0;

  if (member.userId) {
    const [mfa, sessions] = await Promise.all([
      prisma.iamMfaEnrollment.count({
        where: { businessId, userId: member.userId, isVerified: true },
      }),
      listIamSessions(businessId, member.userId),
    ]);
    mfaEnabled = mfa > 0;
    activeSessionCount = sessions.filter((session) => session.isActive).length;
  }

  return {
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
    roles: member.staffRoles.map((entry) => entry.role),
    employeeCode: member.employeeCode,
    fullName: member.fullName || `${member.firstName} ${member.lastName}`.trim(),
    avatar: member.avatar,
    department: member.department,
    jobTitle: member.jobTitle,
    dateOfBirth: member.dateOfBirth?.toISOString() ?? null,
    gender: member.gender,
    hireDate: member.hireDate?.toISOString() ?? null,
    terminationDate: member.terminationDate?.toISOString() ?? null,
    salaryType: member.salaryType,
    hourlyRate: member.hourlyRate ? Number(member.hourlyRate) : null,
    monthlySalary: member.monthlySalary ? Number(member.monthlySalary) : null,
    employmentStatus: member.employmentStatus,
    accountStatus: member.accountStatus,
    lastLoginAt: member.lastLoginAt?.toISOString() ?? null,
    forcePasswordReset: member.forcePasswordReset,
    profile: parseStaffProfile(member.staffProfile),
    branchAssignments: member.branchAssignments.map((assignment) => ({
      branchId: assignment.branchId,
      branchName: assignment.branch.name,
      isPrimary: assignment.isPrimary,
    })),
    mfaEnabled,
    activeSessionCount,
  };
}

async function syncBranchAssignments(
  staffId: string,
  branchIds: string[],
  primaryBranchId: string | null,
): Promise<void> {
  await prisma.staffBranchAssignment.deleteMany({ where: { staffId } });

  if (branchIds.length === 0) {
    return;
  }

  await prisma.staffBranchAssignment.createMany({
    data: branchIds.map((branchId) => ({
      staffId,
      branchId,
      isPrimary: branchId === primaryBranchId,
    })),
    skipDuplicates: true,
  });
}

async function syncStaffRoles(
  staffId: string,
  roleIds: string[] | null | undefined,
): Promise<void> {
  if (roleIds === undefined) {
    return;
  }

  await prisma.staffRole.deleteMany({ where: { staffId } });

  if (!roleIds || roleIds.length === 0) {
    return;
  }

  await prisma.staffRole.createMany({
    data: roleIds.map((roleId) => ({ staffId, roleId })),
    skipDuplicates: true,
  });
}

async function syncStaffRole(staffId: string, roleId: string | null | undefined): Promise<void> {
  if (roleId === undefined) {
    return;
  }

  await syncStaffRoles(staffId, roleId ? [roleId] : []);
}

function buildDirectoryWhere(
  businessId: string,
  query: StaffDirectoryQuery,
): Prisma.StaffWhereInput {
  const where: Prisma.StaffWhereInput = { businessId };

  if (query.branchId) {
    where.OR = [
      { branchId: query.branchId },
      { branchAssignments: { some: { branchId: query.branchId } } },
    ];
  }

  if (query.roleId) {
    where.staffRoles = { some: { roleId: query.roleId } };
  }

  if (query.department) {
    where.department = query.department;
  }

  if (query.employmentStatus) {
    where.employmentStatus = query.employmentStatus;
  }

  if (query.accountStatus) {
    where.accountStatus = query.accountStatus;
  }

  if (query.isActive !== null && query.isActive !== undefined) {
    where.isActive = query.isActive;
  }

  if (query.search?.trim()) {
    const term = query.search.trim();
    where.AND = [
      {
        OR: [
          { firstName: { contains: term, mode: "insensitive" } },
          { lastName: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
          { employeeCode: { contains: term, mode: "insensitive" } },
          { fullName: { contains: term, mode: "insensitive" } },
          { department: { contains: term, mode: "insensitive" } },
          { jobTitle: { contains: term, mode: "insensitive" } },
        ],
      },
    ];
  }

  return where;
}

function buildDirectoryOrderBy(query: StaffDirectoryQuery): Prisma.StaffOrderByWithRelationInput[] {
  const direction = query.sortDirection === "desc" ? "desc" : "asc";

  switch (query.sortBy) {
    case "department":
      return [{ department: direction }, { lastName: "asc" }];
    case "createdAt":
      return [{ createdAt: direction }];
    case "role":
      return [{ staffRoles: { _count: direction } }, { lastName: "asc" }];
    case "name":
    default:
      return [{ lastName: direction }, { firstName: direction }];
  }
}

export async function queryStaffDirectory(
  platform: BusinessContext,
  query: StaffDirectoryQuery = {},
): Promise<StaffDirectoryResult> {
  const pageSize = query.pageSize ?? STAFF_DIRECTORY_PAGE_SIZE;
  const page = Math.max(1, query.page ?? 1);
  const where = buildDirectoryWhere(platform.business.id, query);

  const [total, records] = await Promise.all([
    prisma.staff.count({ where }),
    prisma.staff.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
        staffRoles: {
          include: { role: { select: { id: true, name: true, slug: true, isSystem: true } } },
        },
        branchAssignments: { include: { branch: { select: { id: true, name: true } } } },
        user: { select: { id: true } },
      },
      orderBy: buildDirectoryOrderBy(query),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const items = await Promise.all(
    records.map((record) => serializeStaffMember(platform.business.id, record)),
  );

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getStaffManagementBundle(
  platform: BusinessContext,
  query: StaffDirectoryQuery = {},
): Promise<StaffManagementBundle> {
  await ensureMainBranch(platform.business.id);
  await ensureSystemRoles(platform.business.id);

  const [directory, roles, permissions, branches, assignments, invitations, auditLogs] =
    await Promise.all([
      queryStaffDirectory(platform, query),
      listRoles(platform.business.id),
      listPermissions(),
      listBranches(platform.business.id),
      getRolePermissionAssignments(platform.business.id),
      listStaffInvitations(platform),
      listStaffAuditLogs(platform, { limit: 20 }),
    ]);

  const activeRoles = roles.filter((role) => !role.isArchived);

  return {
    members: directory.items,
    directory,
    roles: activeRoles,
    permissions,
    branches,
    invitations,
    permissionMatrix: {
      roles: activeRoles,
      permissions,
      assignments,
    },
    auditLogs,
    permissionsFlags: buildPermissions(platform),
  };
}

export async function getStaffMemberProfile(
  platform: BusinessContext,
  staffId: string,
): Promise<SerializedStaffMember> {
  const member = await prisma.staff.findFirst({
    where: { id: staffId, businessId: platform.business.id },
    include: {
      branch: { select: { id: true, name: true } },
      staffRoles: {
        include: { role: { select: { id: true, name: true, slug: true, isSystem: true } } },
      },
      branchAssignments: { include: { branch: { select: { id: true, name: true } } } },
      user: { select: { id: true } },
    },
  });

  if (!member) {
    throw new Error("Staff member not found");
  }

  return serializeStaffMember(platform.business.id, member);
}

export async function createStaffMemberProfile(
  platform: BusinessContext,
  input: StaffProfileInput,
): Promise<SerializedStaffMember> {
  if (!input.firstName.trim() || !input.lastName.trim()) {
    throw new Error("First and last name are required");
  }

  if (input.employeeCode) {
    const duplicate = await prisma.staff.findFirst({
      where: {
        businessId: platform.business.id,
        employeeCode: input.employeeCode.trim(),
      },
    });
    if (duplicate) {
      throw new Error("Employee code already exists");
    }
  }

  const branchIds = input.branchIds ?? (input.branchId ? [input.branchId] : []);
  const primaryBranchId =
    input.primaryBranchId ?? input.defaultBranchId ?? input.branchId ?? branchIds[0] ?? null;
  const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();
  const profile = mergeStaffProfile({}, input.profile ?? {});

  const member = await prisma.staff.create({
    data: {
      businessId: platform.business.id,
      branchId: primaryBranchId,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      fullName,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      employeeCode: input.employeeCode?.trim() || null,
      department: input.department?.trim() || null,
      jobTitle: input.jobTitle?.trim() || null,
      avatar: input.avatar?.trim() || profile.avatarUrl,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      gender: input.gender?.trim() || null,
      hireDate: input.hireDate ? new Date(input.hireDate) : null,
      terminationDate: input.terminationDate ? new Date(input.terminationDate) : null,
      salaryType: input.salaryType ?? null,
      hourlyRate: input.hourlyRate ?? null,
      monthlySalary: input.monthlySalary ?? null,
      notes: profile.notes || null,
      emergencyContact: profile.emergencyContact as unknown as Prisma.InputJsonValue,
      employmentStatus: input.employmentStatus ?? "ACTIVE",
      staffProfile: profile as unknown as Prisma.InputJsonValue,
      isActive: input.isActive ?? true,
      accountStatus: "ACTIVE",
    },
  });

  const roleIds = input.roleIds ?? (input.roleId ? [input.roleId] : []);
  await syncStaffRoles(member.id, roleIds);
  await syncBranchAssignments(member.id, branchIds, primaryBranchId);

  await logStaffAudit(platform.business.id, "CREATED", {
    staffId: member.id,
    actorUserId: platform.user.id,
    actorStaffId: platform.staffSession?.staffId ?? null,
    metadata: { roleIds, branchIds },
  });

  return getStaffMemberProfile(platform, member.id);
}

export async function updateStaffMemberProfile(
  platform: BusinessContext,
  staffId: string,
  input: StaffProfileInput,
): Promise<SerializedStaffMember> {
  const existing = await prisma.staff.findFirst({
    where: { id: staffId, businessId: platform.business.id },
  });

  if (!existing) {
    throw new Error("Staff member not found");
  }

  if (input.employeeCode) {
    const duplicate = await prisma.staff.findFirst({
      where: {
        businessId: platform.business.id,
        employeeCode: input.employeeCode.trim(),
        NOT: { id: staffId },
      },
    });
    if (duplicate) {
      throw new Error("Employee code already exists");
    }
  }

  const branchIds =
    input.branchIds ??
    (input.branchId !== undefined ? (input.branchId ? [input.branchId] : []) : undefined);
  const primaryBranchId =
    input.primaryBranchId ??
    input.defaultBranchId ??
    input.branchId ??
    (branchIds && branchIds.length > 0 ? branchIds[0] : existing.branchId);
  const profile = mergeStaffProfile(existing.staffProfile, input.profile ?? {});
  const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();

  await prisma.staff.update({
    where: { id: staffId },
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      fullName,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      employeeCode: input.employeeCode?.trim() || null,
      department: input.department?.trim() || null,
      jobTitle: input.jobTitle?.trim() || null,
      avatar: input.avatar?.trim() || profile.avatarUrl,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      gender: input.gender?.trim() || null,
      hireDate: input.hireDate ? new Date(input.hireDate) : undefined,
      terminationDate: input.terminationDate ? new Date(input.terminationDate) : undefined,
      salaryType: input.salaryType ?? undefined,
      hourlyRate: input.hourlyRate ?? undefined,
      monthlySalary: input.monthlySalary ?? undefined,
      notes: profile.notes || null,
      emergencyContact: profile.emergencyContact as unknown as Prisma.InputJsonValue,
      employmentStatus: input.employmentStatus ?? existing.employmentStatus,
      branchId: primaryBranchId,
      isActive: input.isActive ?? existing.isActive,
      staffProfile: profile as unknown as Prisma.InputJsonValue,
    },
  });

  if (input.roleIds !== undefined) {
    await syncStaffRoles(staffId, input.roleIds);
    await logStaffAudit(platform.business.id, "ROLE_CHANGED", {
      staffId,
      actorUserId: platform.user.id,
      metadata: { roleIds: input.roleIds },
    });
  } else if (input.roleId !== undefined) {
    await syncStaffRole(staffId, input.roleId);
    await logStaffAudit(platform.business.id, "ROLE_CHANGED", {
      staffId,
      actorUserId: platform.user.id,
      metadata: { roleId: input.roleId },
    });
  }

  if (branchIds) {
    await syncBranchAssignments(staffId, branchIds, primaryBranchId ?? null);
    await logStaffAudit(platform.business.id, "BRANCH_CHANGED", {
      staffId,
      actorUserId: platform.user.id,
      metadata: { branchIds, primaryBranchId },
    });
  }

  await logStaffAudit(platform.business.id, "UPDATED", {
    staffId,
    actorUserId: platform.user.id,
    actorStaffId: platform.staffSession?.staffId ?? null,
  });

  return getStaffMemberProfile(platform, staffId);
}

export async function deleteStaffMemberProfile(
  platform: BusinessContext,
  staffId: string,
): Promise<void> {
  const member = await prisma.staff.findFirst({
    where: { id: staffId, businessId: platform.business.id },
  });

  if (!member) {
    throw new Error("Staff member not found");
  }

  await prisma.staff.delete({ where: { id: staffId } });

  await logStaffAudit(platform.business.id, "DEACTIVATED", {
    actorUserId: platform.user.id,
    metadata: { staffId, action: "deleted" },
  });
}

export async function setStaffMemberActiveStatus(
  platform: BusinessContext,
  staffId: string,
  isActive: boolean,
): Promise<void> {
  await prisma.staff.updateMany({
    where: { id: staffId, businessId: platform.business.id },
    data: { isActive },
  });

  await logStaffAudit(platform.business.id, isActive ? "ACTIVATED" : "ARCHIVED", {
    staffId,
    actorUserId: platform.user.id,
  });
}

export async function archiveStaffMember(
  platform: BusinessContext,
  staffId: string,
): Promise<void> {
  await setStaffMemberActiveStatus(platform, staffId, false);
}

export async function restoreStaffMember(
  platform: BusinessContext,
  staffId: string,
): Promise<void> {
  await prisma.staff.updateMany({
    where: { id: staffId, businessId: platform.business.id },
    data: { isActive: true, employmentStatus: "ACTIVE" },
  });

  await logStaffAudit(platform.business.id, "REACTIVATED", {
    staffId,
    actorUserId: platform.user.id,
  });
}

export async function assignStaffMemberRoles(
  platform: BusinessContext,
  staffId: string,
  roleIds: string[],
): Promise<SerializedStaffMember> {
  const existing = await prisma.staff.findFirst({
    where: { id: staffId, businessId: platform.business.id },
  });

  if (!existing) {
    throw new Error("Staff member not found");
  }

  await syncStaffRoles(staffId, roleIds);

  await logStaffAudit(platform.business.id, "ROLE_CHANGED", {
    staffId,
    actorUserId: platform.user.id,
    metadata: { roleIds },
  });

  return getStaffMemberProfile(platform, staffId);
}

export async function assignStaffMemberBranches(
  platform: BusinessContext,
  staffId: string,
  branchIds: string[],
  primaryBranchId?: string | null,
): Promise<SerializedStaffMember> {
  const existing = await prisma.staff.findFirst({
    where: { id: staffId, businessId: platform.business.id },
  });

  if (!existing) {
    throw new Error("Staff member not found");
  }

  const resolvedPrimary = primaryBranchId ?? branchIds[0] ?? null;

  await prisma.staff.update({
    where: { id: staffId },
    data: { branchId: resolvedPrimary },
  });
  await syncBranchAssignments(staffId, branchIds, resolvedPrimary);

  await logStaffAudit(platform.business.id, "BRANCH_CHANGED", {
    staffId,
    actorUserId: platform.user.id,
    metadata: { branchIds, primaryBranchId: resolvedPrimary },
  });

  return getStaffMemberProfile(platform, staffId);
}

export async function updateStaffSecurityStatus(
  platform: BusinessContext,
  staffId: string,
  input: {
    accountStatus?: StaffAccountStatus;
    forcePasswordReset?: boolean;
    lockAccount?: boolean;
    suspend?: boolean;
    reactivate?: boolean;
  },
): Promise<SerializedStaffMember> {
  const existing = await prisma.staff.findFirst({
    where: { id: staffId, businessId: platform.business.id },
  });

  if (!existing) {
    throw new Error("Staff member not found");
  }

  let accountStatus = input.accountStatus ?? existing.accountStatus;
  let eventType: StaffAuditEventType = "UPDATED";

  if (input.lockAccount) {
    accountStatus = "LOCKED";
    eventType = "LOCKED";
  } else if (input.suspend) {
    accountStatus = "SUSPENDED";
    eventType = "SUSPENDED";
  } else if (input.reactivate) {
    accountStatus = "ACTIVE";
    eventType = "REACTIVATED";
  }

  await prisma.staff.update({
    where: { id: staffId },
    data: {
      accountStatus,
      forcePasswordReset: input.forcePasswordReset ?? existing.forcePasswordReset,
      isActive: input.reactivate ? true : input.suspend ? false : existing.isActive,
    },
  });

  if (input.forcePasswordReset) {
    await logStaffAudit(platform.business.id, "PASSWORD_RESET", {
      staffId,
      actorUserId: platform.user.id,
    });
  }

  await logStaffAudit(platform.business.id, eventType, {
    staffId,
    actorUserId: platform.user.id,
    metadata: { accountStatus },
  });

  return getStaffMemberProfile(platform, staffId);
}

function createInvitationToken(email: string, businessId: string): string {
  return createHash("sha256")
    .update(`${email}:${businessId}:${randomBytes(32).toString("hex")}:${Date.now()}`)
    .digest("hex");
}

async function sendStaffInvitationNotification(
  platform: BusinessContext,
  invitation: StaffInvitationData,
): Promise<void> {
  await publishNotificationEvent({
    businessId: platform.business.id,
    category: "SYSTEM",
    title: "You have been invited to join Busal OS",
    body: `You have been invited to join ${platform.business.businessName ?? "the business"} as a team member.`,
    triggeredByUserId: platform.user.id,
    triggeredByModule: "staff",
    recipientEmail: invitation.email,
    templateSlug: "staff-invitation",
    templateVariables: {
      businessName: platform.business.businessName ?? "Busal OS",
      inviteToken: invitation.id,
    },
    payload: { invitationId: invitation.id },
    channels: ["EMAIL", "IN_APP"],
  });
}

function serializeInvitation(
  invitation: Prisma.StaffInvitationGetPayload<{ include: { role: { select: { name: true } } } }>,
): StaffInvitationData {
  return {
    id: invitation.id,
    email: invitation.email,
    roleId: invitation.roleId,
    roleName: invitation.role?.name ?? null,
    branchIds: invitation.branchIds,
    defaultBranchId: invitation.defaultBranchId,
    status: invitation.status,
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
  };
}

export async function listStaffInvitations(
  platform: BusinessContext,
): Promise<StaffInvitationData[]> {
  const invitations = await prisma.staffInvitation.findMany({
    where: { businessId: platform.business.id },
    include: { role: { select: { name: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return invitations.map(serializeInvitation);
}

export async function inviteStaffMember(
  platform: BusinessContext,
  input: StaffInvitationInput,
): Promise<StaffInvitationData> {
  const email = input.email.trim().toLowerCase();

  if (!email) {
    throw new Error("Email is required");
  }

  const pending = await prisma.staffInvitation.findFirst({
    where: { businessId: platform.business.id, email, status: "PENDING" },
  });

  if (pending) {
    throw new Error("A pending invitation already exists for this email");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + STAFF_INVITATION_EXPIRY_DAYS);

  const invitation = await prisma.staffInvitation.create({
    data: {
      businessId: platform.business.id,
      email,
      roleId: input.roleId ?? null,
      branchIds: input.branchIds ?? [],
      defaultBranchId: input.defaultBranchId ?? input.branchIds?.[0] ?? null,
      token: createInvitationToken(email, platform.business.id),
      status: "PENDING",
      invitedByUserId: platform.user.id,
      invitedByStaffId: platform.staffSession?.staffId ?? null,
      expiresAt,
    },
    include: { role: { select: { name: true } } },
  });

  const serialized = serializeInvitation(invitation);

  await sendStaffInvitationNotification(platform, serialized);

  await logStaffAudit(platform.business.id, "INVITED", {
    actorUserId: platform.user.id,
    metadata: { email, invitationId: invitation.id },
  });

  return serialized;
}

export async function resendStaffInvitation(
  platform: BusinessContext,
  invitationId: string,
): Promise<StaffInvitationData> {
  const invitation = await prisma.staffInvitation.findFirst({
    where: { id: invitationId, businessId: platform.business.id, status: "PENDING" },
    include: { role: { select: { name: true } } },
  });

  if (!invitation) {
    throw new Error("Pending invitation not found");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + STAFF_INVITATION_EXPIRY_DAYS);

  const updated = await prisma.staffInvitation.update({
    where: { id: invitation.id },
    data: {
      token: createInvitationToken(invitation.email, platform.business.id),
      expiresAt,
    },
    include: { role: { select: { name: true } } },
  });

  const serialized = serializeInvitation(updated);
  await sendStaffInvitationNotification(platform, serialized);

  await logStaffAudit(platform.business.id, "INVITATION_RESENT", {
    actorUserId: platform.user.id,
    metadata: { invitationId },
  });

  return serialized;
}

export async function cancelStaffInvitation(
  platform: BusinessContext,
  invitationId: string,
): Promise<void> {
  const invitation = await prisma.staffInvitation.findFirst({
    where: { id: invitationId, businessId: platform.business.id, status: "PENDING" },
  });

  if (!invitation) {
    throw new Error("Pending invitation not found");
  }

  await prisma.staffInvitation.update({
    where: { id: invitation.id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  await logStaffAudit(platform.business.id, "INVITATION_CANCELLED", {
    actorUserId: platform.user.id,
    metadata: { invitationId },
  });
}

export async function bulkInviteStaffMembers(
  platform: BusinessContext,
  input: BulkInviteInput,
): Promise<StaffInvitationData[]> {
  const results: StaffInvitationData[] = [];

  for (const invitation of input.invitations) {
    results.push(await inviteStaffMember(platform, invitation));
  }

  return results;
}

export async function bulkUpdateStaffMembers(
  platform: BusinessContext,
  input: BulkStaffUpdateInput,
): Promise<void> {
  if (input.staffIds.length === 0) {
    throw new Error("Select at least one staff member");
  }

  for (const staffId of input.staffIds) {
    const data: Prisma.StaffUpdateInput = {};

    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
    }

    if (input.employmentStatus) {
      data.employmentStatus = input.employmentStatus;
    }

    if (input.branchId !== undefined) {
      data.branch = input.branchId ? { connect: { id: input.branchId } } : { disconnect: true };
    }

    await prisma.staff.update({
      where: { id: staffId, businessId: platform.business.id },
      data,
    });

    if (input.roleId !== undefined) {
      await syncStaffRole(staffId, input.roleId);
    }

    if (input.branchId !== undefined || input.defaultBranchId) {
      const branchIds = input.branchId ? [input.branchId] : [];
      await syncBranchAssignments(
        staffId,
        branchIds,
        input.defaultBranchId ?? input.branchId ?? null,
      );
    }
  }

  await logStaffAudit(platform.business.id, "BULK_UPDATE", {
    actorUserId: platform.user.id,
    metadata: input as unknown as Record<string, unknown>,
  });
}

export async function createStaffRole(platform: BusinessContext, input: RoleInput): Promise<void> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Role name is required");
  }

  const slugBase = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  let slug = slugBase;
  let attempt = 1;

  while (
    await prisma.role.findUnique({
      where: { businessId_slug: { businessId: platform.business.id, slug } },
    })
  ) {
    slug = `${slugBase}-${attempt}`;
    attempt += 1;
  }

  await prisma.role.create({
    data: {
      businessId: platform.business.id,
      name,
      slug,
      description: input.description?.trim() || null,
      isSystem: false,
    },
  });

  await logStaffAudit(platform.business.id, "CREATED", {
    actorUserId: platform.user.id,
    metadata: { roleName: name },
  });
}

export async function duplicateStaffRole(platform: BusinessContext, roleId: string): Promise<void> {
  const role = await prisma.role.findFirst({
    where: { id: roleId, businessId: platform.business.id },
    include: { rolePermissions: true },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  const copyName = `${role.name} Copy`;
  const slugBase = `${role.slug}-copy`;
  let slug = slugBase;
  let attempt = 1;

  while (
    await prisma.role.findUnique({
      where: { businessId_slug: { businessId: platform.business.id, slug } },
    })
  ) {
    slug = `${slugBase}-${attempt}`;
    attempt += 1;
  }

  const created = await prisma.role.create({
    data: {
      businessId: platform.business.id,
      name: copyName,
      slug,
      description: role.description,
      isSystem: false,
    },
  });

  if (role.rolePermissions.length > 0) {
    await prisma.rolePermission.createMany({
      data: role.rolePermissions.map((entry) => ({
        roleId: created.id,
        permissionId: entry.permissionId,
      })),
      skipDuplicates: true,
    });
  }

  await logStaffAudit(platform.business.id, "DUPLICATE", {
    actorUserId: platform.user.id,
    metadata: { sourceRoleId: roleId, newRoleId: created.id },
  });
}

export async function archiveStaffRole(platform: BusinessContext, roleId: string): Promise<void> {
  const role = await prisma.role.findFirst({
    where: { id: roleId, businessId: platform.business.id },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  if (role.isSystem) {
    throw new Error("System roles cannot be archived");
  }

  await prisma.role.update({
    where: { id: roleId },
    data: { isArchived: true },
  });

  await logStaffAudit(platform.business.id, "ARCHIVED", {
    actorUserId: platform.user.id,
    metadata: { roleId },
  });
}

export async function saveStaffRolePermissions(
  platform: BusinessContext,
  assignments: PermissionAssignmentInput[],
): Promise<void> {
  await saveRolePermissions(platform.business.ownerId, assignments);

  await logStaffAudit(platform.business.id, "PERMISSION_CHANGED", {
    actorUserId: platform.user.id,
    metadata: { roleCount: assignments.length },
  });
}

export async function listStaffAuditLogs(
  platform: BusinessContext,
  options: { staffId?: string; limit?: number } = {},
): Promise<StaffAuditEntry[]> {
  const logs = await prisma.staffAuditLog.findMany({
    where: {
      businessId: platform.business.id,
      ...(options.staffId ? { staffId: options.staffId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options.limit ?? 50,
  });

  return logs.map((log) => ({
    id: log.id,
    staffId: log.staffId,
    eventType: log.eventType,
    metadata: (log.metadata as Record<string, unknown> | null) ?? null,
    createdAt: log.createdAt.toISOString(),
  }));
}

export async function listStaffMemberActivity(
  platform: BusinessContext,
  staffId: string,
): Promise<StaffAuditEntry[]> {
  return listStaffAuditLogs(platform, { staffId, limit: 100 });
}
