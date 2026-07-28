import "server-only";

import type { User as SupabaseUser } from "@supabase/supabase-js";

import { USER_ROLES } from "@/constants/roles";
import { prisma } from "@/lib/prisma";
import { getRolePermissions } from "@/modules/authorization/services/authorization.service";
import { ACCOUNT_TYPES, STAFF_AUTH_ERROR_CODES } from "@/modules/staff-auth/constants/session";
import {
  clearStaffSessionCookie,
  getStaffSessionCookie,
  refreshStaffSessionCookie,
  setStaffSessionCookie,
} from "@/modules/staff-auth/services/staff-session.service";
import type {
  LoginSessionResult,
  ResolvedBusinessAccess,
  StaffSessionData,
} from "@/modules/staff-auth/types/staff-session";
import { StaffAuthError } from "@/modules/staff-auth/utils/staff-auth-errors";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import { ensureSystemRoles } from "@/services/staff-management.service";

const staffInclude = {
  business: {
    select: {
      id: true,
      businessName: true,
      onboardingCompleted: true,
      ownerId: true,
    },
  },
  branch: {
    select: { id: true, name: true },
  },
  staffRoles: {
    include: {
      role: {
        select: { id: true, slug: true, name: true },
      },
    },
  },
} as const;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function resolveStaffName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

async function loadStaffRecord(options: {
  userId?: string;
  email?: string;
  staffId?: string;
  includeInactive?: boolean;
}) {
  const activeFilter = options.includeInactive ? {} : { isActive: true as const };

  if (options.staffId) {
    return prisma.staff.findUnique({
      where: { id: options.staffId },
      include: staffInclude,
    });
  }

  if (options.userId) {
    return prisma.staff.findFirst({
      where: { userId: options.userId, ...activeFilter },
      include: staffInclude,
    });
  }

  if (options.email) {
    return prisma.staff.findFirst({
      where: {
        email: { equals: normalizeEmail(options.email), mode: "insensitive" },
        ...activeFilter,
      },
      include: staffInclude,
    });
  }

  return null;
}

function assertStaffRecordValid(
  staff: NonNullable<Awaited<ReturnType<typeof loadStaffRecord>>>,
): void {
  if (!staff.business) {
    throw new StaffAuthError(STAFF_AUTH_ERROR_CODES.BUSINESS_NOT_FOUND);
  }

  if (!staff.business.onboardingCompleted) {
    throw new StaffAuthError(STAFF_AUTH_ERROR_CODES.BUSINESS_INACTIVE);
  }

  if (staff.staffRoles.length === 0) {
    throw new StaffAuthError(STAFF_AUTH_ERROR_CODES.ROLE_NOT_ASSIGNED);
  }
}

export async function buildStaffSessionData(
  staff: NonNullable<Awaited<ReturnType<typeof loadStaffRecord>>>,
  userId: string,
): Promise<StaffSessionData> {
  assertStaffRecordValid(staff);
  await ensureSystemRoles(staff.businessId);

  const primaryRole = staff.staffRoles[0]?.role;

  if (!primaryRole) {
    throw new StaffAuthError(STAFF_AUTH_ERROR_CODES.ROLE_NOT_ASSIGNED);
  }

  const permissions = await getRolePermissions(primaryRole.id, staff.businessId);

  return {
    staffId: staff.id,
    userId,
    businessId: staff.businessId,
    branchId: staff.branchId,
    roleSlug: primaryRole.slug,
    roleName: primaryRole.name,
    permissions,
    staffName: resolveStaffName(staff.firstName, staff.lastName),
    businessName: staff.business.businessName,
  };
}

export async function linkStaffToUser(staffId: string, userId: string): Promise<void> {
  await prisma.staff.update({
    where: { id: staffId },
    data: { userId },
  });
}

export async function ensureStaffUserProfile(
  supabaseUser: SupabaseUser,
  staffId: string,
  fallbackFullName?: string,
) {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { firstName: true, lastName: true },
  });

  const fullName =
    fallbackFullName?.trim() ||
    (staff ? resolveStaffName(staff.firstName, staff.lastName) : undefined) ||
    supabaseUser.email?.split("@")[0] ||
    "Staff";

  const user = await prisma.user.upsert({
    where: { id: supabaseUser.id },
    create: {
      id: supabaseUser.id,
      email: supabaseUser.email ?? "",
      fullName,
      role: USER_ROLES.STAFF,
    },
    update: {
      email: supabaseUser.email ?? "",
      fullName,
      role: USER_ROLES.STAFF,
    },
  });

  await linkStaffToUser(staffId, user.id);
  return user;
}

export async function authenticateStaffAccount(
  userId: string,
  email: string,
): Promise<StaffSessionData> {
  const staff =
    (await loadStaffRecord({ userId, includeInactive: true })) ??
    (await loadStaffRecord({ email: normalizeEmail(email), includeInactive: true }));

  if (!staff) {
    throw new StaffAuthError(STAFF_AUTH_ERROR_CODES.STAFF_NOT_FOUND);
  }

  if (!staff.isActive) {
    throw new StaffAuthError(STAFF_AUTH_ERROR_CODES.STAFF_INACTIVE);
  }

  assertStaffRecordValid(staff);

  if (staff.business.ownerId === userId) {
    throw new StaffAuthError(STAFF_AUTH_ERROR_CODES.STAFF_NOT_FOUND);
  }

  await linkStaffToUser(staff.id, userId);

  return buildStaffSessionData(staff, userId);
}

export async function establishStaffSession(
  userId: string,
  email: string,
): Promise<StaffSessionData> {
  const session = await authenticateStaffAccount(userId, email);
  await setStaffSessionCookie(session);
  return session;
}

export async function clearStaffSession(): Promise<void> {
  await clearStaffSessionCookie();
}

export async function refreshStaffSession(
  userId: string,
  email: string,
): Promise<StaffSessionData | null> {
  const existing = await getStaffSessionCookie();

  if (!existing || existing.userId !== userId) {
    return null;
  }

  const session = await authenticateStaffAccount(userId, email);
  await refreshStaffSessionCookie(session);
  return session;
}

export async function determineLoginAccountType(
  userId: string,
  email: string,
): Promise<LoginSessionResult> {
  const ownedBusiness = await getBusinessByOwnerId(userId);

  if (ownedBusiness?.onboardingCompleted) {
    return {
      accountType: ACCOUNT_TYPES.OWNER,
      staffSession: null,
    };
  }

  const staff =
    (await loadStaffRecord({ userId, includeInactive: true })) ??
    (await loadStaffRecord({ email, includeInactive: true }));

  if (!staff || !staff.isActive) {
    return {
      accountType: ACCOUNT_TYPES.OWNER,
      staffSession: null,
    };
  }

  if (staff.business.ownerId === userId) {
    return {
      accountType: ACCOUNT_TYPES.OWNER,
      staffSession: null,
    };
  }

  await linkStaffToUser(staff.id, userId);
  const staffSession = await buildStaffSessionData(staff, userId);

  return {
    accountType: ACCOUNT_TYPES.STAFF,
    staffSession,
  };
}

export async function resolveStaffLogin(
  userId: string,
  email: string,
): Promise<StaffSessionData | null> {
  const loginResult = await determineLoginAccountType(userId, email);

  if (loginResult.accountType === ACCOUNT_TYPES.OWNER || !loginResult.staffSession) {
    await clearStaffSessionCookie();
    return null;
  }

  await setStaffSessionCookie(loginResult.staffSession);
  return loginResult.staffSession;
}

export async function completeLoginSession(
  userId: string,
  email: string,
): Promise<LoginSessionResult> {
  const loginResult = await determineLoginAccountType(userId, email);

  if (loginResult.accountType === ACCOUNT_TYPES.STAFF && loginResult.staffSession) {
    await setStaffSessionCookie(loginResult.staffSession);
    return loginResult;
  }

  await clearStaffSessionCookie();

  return {
    accountType: ACCOUNT_TYPES.OWNER,
    staffSession: null,
  };
}

export async function resolveBusinessAccessForUser(
  userId: string,
  email: string,
): Promise<ResolvedBusinessAccess> {
  const staffSession = await getStaffSessionCookie();

  if (staffSession && staffSession.userId === userId) {
    const staff = await loadStaffRecord({ staffId: staffSession.staffId });

    if (!staff || !staff.isActive || staff.businessId !== staffSession.businessId) {
      throw new StaffAuthError(STAFF_AUTH_ERROR_CODES.SESSION_INVALID);
    }

    assertStaffRecordValid(staff);

    return {
      businessId: staffSession.businessId,
      isOwner: false,
      staffSession,
    };
  }

  const ownedBusiness = await getBusinessByOwnerId(userId);

  if (ownedBusiness) {
    return {
      businessId: ownedBusiness.id,
      isOwner: true,
      staffSession: null,
    };
  }

  const staff = (await loadStaffRecord({ userId })) ?? (await loadStaffRecord({ email }));

  if (staff) {
    assertStaffRecordValid(staff);
    const session = await buildStaffSessionData(staff, userId);

    return {
      businessId: session.businessId,
      isOwner: false,
      staffSession: session,
    };
  }

  throw new StaffAuthError(STAFF_AUTH_ERROR_CODES.BUSINESS_NOT_FOUND);
}

export async function assertStaffBelongsToBusiness(
  staffId: string,
  businessId: string,
): Promise<void> {
  const staff = await prisma.staff.findFirst({
    where: { id: staffId, businessId, isActive: true },
    select: { id: true },
  });

  if (!staff) {
    throw new StaffAuthError(STAFF_AUTH_ERROR_CODES.WRONG_BUSINESS);
  }
}

export async function findActiveStaffByEmail(email: string) {
  return loadStaffRecord({ email: normalizeEmail(email) });
}

export async function findActiveStaffByUserId(userId: string) {
  return loadStaffRecord({ userId });
}

export async function isStaffAccount(userId: string, email: string): Promise<boolean> {
  const staff = (await loadStaffRecord({ userId })) ?? (await loadStaffRecord({ email }));
  return Boolean(staff?.isActive);
}
