import "server-only";

import type { Business } from "@prisma/client";
import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { prisma } from "@/lib/prisma";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import {
  clearActiveBranchCookie,
  clearBusinessContextCookies,
  getActiveBranchCookie,
  getActiveBusinessCookie,
  setActiveBranchCookie,
  setActiveBusinessCookie,
} from "@/modules/business-context/services/business-context-session.service";
import type {
  BranchOption,
  BusinessContext,
  BusinessOption,
  ClientBusinessContext,
} from "@/modules/business-context/types/business-context";
import { BusinessContextError } from "@/modules/business-context/utils/business-context-errors";
import { resolveBusinessAccessForUser } from "@/modules/staff-auth/services/staff-auth.service";
import { StaffAuthError } from "@/modules/staff-auth/utils/staff-auth-errors";
import { getCurrentUser } from "@/services/auth.service";
import {
  getOwnedBusinessById,
  isBusinessOnboardingCompleted,
  isOnboardingCompleted,
  listBusinessesForOwner,
} from "@/services/business-profile.service";
import { listBranches, type BranchData } from "@/services/business-management.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

function mapBusinessRecord(business: Business): BusinessProfileData & { id: string } {
  return {
    id: business.id,
    ownerId: business.ownerId,
    ownerName: business.ownerName,
    businessName: business.businessName,
    businessType: business.businessType,
    country: business.country,
    timezone: business.timezone,
    aiName: business.aiName,
    aiPersonality: business.aiPersonality,
    businessGoal: business.businessGoal,
    businessDna: business.businessDna as BusinessProfileData["businessDna"],
    businessCode: business.businessCode,
    industry: business.industry,
    currency: business.currency,
    phone: business.phone,
    businessEmail: business.businessEmail,
    businessSetupCompleted: business.businessSetupCompleted,
    businessSetupStep: business.businessSetupStep,
    onboardingCompleted: business.onboardingCompleted,
    onboardingStep: business.onboardingStep,
    createdAt: business.createdAt,
    updatedAt: business.updatedAt,
  };
}

function toBusinessOptions(businesses: BusinessProfileData[]): BusinessOption[] {
  return businesses.map((business) => ({
    id: business.id,
    name: business.businessName?.trim() || "Untitled business",
    isOnboarded: business.onboardingCompleted,
  }));
}

function toBranchOptions(branches: BranchData[]): BranchOption[] {
  return branches.map((branch) => ({
    id: branch.id,
    name: branch.name,
    isMain: branch.isMain,
  }));
}

async function loadBusinessProfile(
  businessId: string,
): Promise<BusinessProfileData & { id: string }> {
  const business = await prisma.business.findUnique({ where: { id: businessId } });

  if (!business) {
    throw new BusinessContextError("BUSINESS_NOT_FOUND");
  }

  return mapBusinessRecord(business);
}

export async function assertUserBelongsToBusiness(
  userId: string,
  businessId: string,
  email: string,
): Promise<{ isOwner: boolean }> {
  const owned = await getOwnedBusinessById(userId, businessId);

  if (owned) {
    return { isOwner: true };
  }

  const staff = await prisma.staff.findFirst({
    where: {
      businessId,
      isActive: true,
      OR: [{ userId }, { email: { equals: email, mode: "insensitive" } }],
    },
    select: { id: true },
  });

  if (!staff) {
    throw new BusinessContextError("CROSS_BUSINESS_ACCESS");
  }

  return { isOwner: false };
}

export async function assertBranchBelongsToBusiness(
  businessId: string,
  branchId: string,
): Promise<BranchData> {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, businessId },
  });

  if (!branch) {
    throw new BusinessContextError("BRANCH_NOT_FOUND");
  }

  return branch;
}

async function resolveOwnerActiveBusinessId(
  userId: string,
  businesses: BusinessProfileData[],
  fallbackBusinessId: string,
): Promise<string> {
  const cookie = await getActiveBusinessCookie();

  if (
    cookie?.userId === userId &&
    businesses.some((business) => business.id === cookie.businessId)
  ) {
    return cookie.businessId;
  }

  if (businesses.some((business) => business.id === fallbackBusinessId)) {
    return fallbackBusinessId;
  }

  const onboarded = businesses.find((business) => business.onboardingCompleted);

  if (onboarded) {
    return onboarded.id;
  }

  if (businesses[0]) {
    return businesses[0].id;
  }

  throw new BusinessContextError("BUSINESS_NOT_FOUND");
}

async function resolveActiveBranch(
  userId: string,
  businessId: string,
  branches: BranchData[],
  preferredBranchId: string | null,
): Promise<BranchData | null> {
  if (branches.length === 0) {
    return null;
  }

  const cookie = await getActiveBranchCookie();

  if (
    cookie?.userId === userId &&
    cookie.businessId === businessId &&
    branches.some((branch) => branch.id === cookie.branchId)
  ) {
    return branches.find((branch) => branch.id === cookie.branchId) ?? null;
  }

  if (preferredBranchId && branches.some((branch) => branch.id === preferredBranchId)) {
    return branches.find((branch) => branch.id === preferredBranchId) ?? null;
  }

  return branches.find((branch) => branch.isMain) ?? branches[0] ?? null;
}

export async function resolveBusinessContextForUser(user: AuthUser): Promise<BusinessContext> {
  const access = await resolveBusinessAccessForUser(user.id, user.email);

  if (access.isOwner) {
    const completed = await isOnboardingCompleted(user.id);

    if (!completed) {
      redirect(ROUTES.onboarding);
    }

    const businesses = await listBusinessesForOwner(user.id);
    const activeBusinessId = await resolveOwnerActiveBusinessId(
      user.id,
      businesses,
      access.businessId,
    );
    const business = await loadBusinessProfile(activeBusinessId);

    if (!business.onboardingCompleted) {
      throw new BusinessContextError("BUSINESS_INACTIVE");
    }

    const branches = await listBranches(business.id);
    const branch = await resolveActiveBranch(user.id, business.id, branches, null);

    const authorization = await resolveAuthorizationContext(user, business);

    return {
      user,
      business,
      branch,
      branchId: branch?.id ?? null,
      roleSlug: authorization.roleSlug,
      permissions: Array.from(authorization.permissions),
      authorization,
      staffSession: null,
      isOwner: true,
      accessibleBusinesses: toBusinessOptions(businesses),
      accessibleBranches: toBranchOptions(branches),
    };
  }

  const business = await loadBusinessProfile(access.businessId);

  if (!business.onboardingCompleted) {
    throw new BusinessContextError("BUSINESS_INACTIVE");
  }

  const branches = await listBranches(business.id);
  const branch = await resolveActiveBranch(
    user.id,
    business.id,
    branches,
    access.staffSession?.branchId ?? null,
  );

  const authorization = await resolveAuthorizationContext(user, business);

  return {
    user,
    business,
    branch,
    branchId: branch?.id ?? null,
    roleSlug: authorization.roleSlug,
    permissions: Array.from(authorization.permissions),
    authorization,
    staffSession: access.staffSession,
    isOwner: false,
    accessibleBusinesses: toBusinessOptions([business]),
    accessibleBranches: toBranchOptions(branches),
  };
}

export const requireBusinessContext = cache(async (): Promise<BusinessContext> => {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  try {
    return await resolveBusinessContextForUser(user);
  } catch (error) {
    if (error instanceof StaffAuthError || error instanceof BusinessContextError) {
      redirect(ROUTES.login);
    }

    throw error;
  }
});

export const requireBusinessContextForApi = cache(async (): Promise<BusinessContext> => {
  const user = await getCurrentUser();

  if (!user) {
    throw new BusinessContextError("UNAUTHORIZED");
  }

  try {
    return await resolveBusinessContextForUser(user);
  } catch (error) {
    if (error instanceof StaffAuthError) {
      throw new BusinessContextError("INVALID_CONTEXT");
    }

    throw error;
  }
});

export async function getActiveBusiness(): Promise<BusinessProfileData & { id: string }> {
  const context = await requireBusinessContext();
  return context.business;
}

export async function getActiveBranch(): Promise<BranchData | null> {
  const context = await requireBusinessContext();
  return context.branch;
}

export async function switchBusiness(businessId: string): Promise<BusinessContext> {
  const user = await getCurrentUser();

  if (!user) {
    throw new BusinessContextError("UNAUTHORIZED");
  }

  const owned = await getOwnedBusinessById(user.id, businessId);

  if (!owned) {
    throw new BusinessContextError("CROSS_BUSINESS_ACCESS");
  }

  if (!(await isBusinessOnboardingCompleted(businessId))) {
    throw new BusinessContextError("BUSINESS_INACTIVE");
  }

  await setActiveBusinessCookie({ userId: user.id, businessId });
  await clearActiveBranchCookie();

  return resolveBusinessContextForUser(user);
}

export async function switchBranch(branchId: string): Promise<BusinessContext> {
  const user = await getCurrentUser();

  if (!user) {
    throw new BusinessContextError("UNAUTHORIZED");
  }

  const current = await resolveBusinessContextForUser(user);
  const branch = await assertBranchBelongsToBusiness(current.business.id, branchId);

  await setActiveBranchCookie({
    userId: user.id,
    businessId: current.business.id,
    branchId: branch.id,
  });

  return resolveBusinessContextForUser(user);
}

export function serializeClientBusinessContext(context: BusinessContext): ClientBusinessContext {
  return {
    businessId: context.business.id,
    businessName: context.business.businessName?.trim() || "Untitled business",
    branchId: context.branchId,
    branchName: context.branch?.name ?? null,
    roleSlug: context.roleSlug,
    isOwner: context.isOwner,
    accessibleBusinesses: context.accessibleBusinesses,
    accessibleBranches: context.accessibleBranches,
  };
}

export async function clearActiveBusinessContext(): Promise<void> {
  await clearBusinessContextCookies();
}
