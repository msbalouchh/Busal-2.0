import "server-only";

import { prisma } from "@/lib/prisma";
import { getActiveBusinessCookie } from "@/modules/business-context/services/business-context-session.service";
import { BusinessContextError } from "@/modules/business-context/utils/business-context-errors";
import { getStaffSessionCookie } from "@/modules/staff-auth/services/staff-session.service";
import {
  getBusinessByOwnerId,
  getOwnedBusinessById,
  listBusinessesForOwner,
} from "@/services/business-profile.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

function mapBusinessRecord(business: {
  id: string;
  ownerId: string;
  ownerName: string | null;
  businessName: string | null;
  businessType: string | null;
  country: string | null;
  timezone: string | null;
  aiName: string | null;
  aiPersonality: string | null;
  businessGoal: string | null;
  businessDna: unknown;
  businessCode?: string | null;
  industry?: string | null;
  currency?: string | null;
  phone?: string | null;
  businessEmail?: string | null;
  businessSetupCompleted?: boolean;
  businessSetupStep?: number;
  onboardingCompleted: boolean;
  onboardingStep: number;
  createdAt: Date;
  updatedAt: Date;
}): BusinessProfileData & { id: string } {
  return {
    id: business.id,
    ownerId: business.ownerId,
    ownerName: business.ownerName,
    businessName: business.businessName,
    businessType: business.businessType as BusinessProfileData["businessType"],
    country: business.country,
    timezone: business.timezone,
    aiName: business.aiName,
    aiPersonality: business.aiPersonality,
    businessGoal: business.businessGoal,
    businessDna: business.businessDna as BusinessProfileData["businessDna"],
    businessCode: business.businessCode ?? null,
    industry: business.industry ?? null,
    currency: business.currency ?? null,
    phone: business.phone ?? null,
    businessEmail: business.businessEmail ?? null,
    businessSetupCompleted: business.businessSetupCompleted ?? false,
    businessSetupStep: business.businessSetupStep ?? 1,
    onboardingCompleted: business.onboardingCompleted,
    onboardingStep: business.onboardingStep,
    createdAt: business.createdAt,
    updatedAt: business.updatedAt,
  };
}

async function resolveBaseBusinessAccess(
  userId: string,
  email: string,
): Promise<{ businessId: string; isOwner: boolean }> {
  const staffSession = await getStaffSessionCookie();

  if (staffSession?.userId === userId) {
    const staff = await prisma.staff.findFirst({
      where: {
        id: staffSession.staffId,
        businessId: staffSession.businessId,
        isActive: true,
      },
      select: { businessId: true },
    });

    if (!staff) {
      throw new BusinessContextError("INVALID_CONTEXT");
    }

    return { businessId: staffSession.businessId, isOwner: false };
  }

  const ownedBusiness = await getBusinessByOwnerId(userId);

  if (ownedBusiness) {
    return { businessId: ownedBusiness.id, isOwner: true };
  }

  const staff = await prisma.staff.findFirst({
    where: {
      isActive: true,
      OR: [{ userId }, { email: { equals: email, mode: "insensitive" } }],
    },
    select: { businessId: true },
    orderBy: { createdAt: "asc" },
  });

  if (!staff) {
    throw new BusinessContextError("BUSINESS_NOT_FOUND");
  }

  return { businessId: staff.businessId, isOwner: false };
}

export async function resolveActiveBusinessIdForUser(
  userId: string,
  email: string,
): Promise<string> {
  const access = await resolveBaseBusinessAccess(userId, email);

  if (!access.isOwner) {
    return access.businessId;
  }

  const businesses = await listBusinessesForOwner(userId);
  const cookie = await getActiveBusinessCookie();

  if (
    cookie?.userId === userId &&
    businesses.some((business) => business.id === cookie.businessId)
  ) {
    return cookie.businessId;
  }

  if (businesses.some((business) => business.id === access.businessId)) {
    return access.businessId;
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

export async function resolveActiveBusinessForUser(
  user: AuthUser,
): Promise<BusinessProfileData & { id: string }> {
  const businessId = await resolveActiveBusinessIdForUser(user.id, user.email);
  const owned = await getOwnedBusinessById(user.id, businessId);

  if (owned) {
    return owned;
  }

  const business = await prisma.business.findUnique({ where: { id: businessId } });

  if (!business) {
    throw new BusinessContextError("BUSINESS_NOT_FOUND");
  }

  const staff = await prisma.staff.findFirst({
    where: {
      businessId,
      isActive: true,
      OR: [{ userId: user.id }, { email: { equals: user.email, mode: "insensitive" } }],
    },
    select: { id: true },
  });

  if (!staff) {
    throw new BusinessContextError("CROSS_BUSINESS_ACCESS");
  }

  return mapBusinessRecord(business);
}
