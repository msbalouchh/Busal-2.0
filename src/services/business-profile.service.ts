import "server-only";

import type { Business, BusinessType, Prisma } from "@prisma/client";

import { getActiveBusinessCookie } from "@/modules/business-context/services/business-context-session.service";
import { ONBOARDING_TOTAL_STEPS } from "@/modules/onboarding/config/onboarding-steps";
import { prisma } from "@/lib/prisma";
import { DEFAULT_BUSINESS_VALUES } from "@/services/business-provisioning.service";
import type { BusinessDna, BusinessProfileData } from "@/types/business-profile";

function mapBusiness(business: Business): BusinessProfileData {
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
    businessDna: business.businessDna as BusinessDna,
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

export async function getPrimaryBusinessByOwnerId(ownerId: string): Promise<Business | null> {
  return prisma.business.findFirst({
    where: { ownerId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getBusinessByOwnerId(ownerId: string): Promise<BusinessProfileData | null> {
  const businesses = await listBusinessesForOwner(ownerId);

  if (businesses.length === 0) {
    return null;
  }

  const cookie = await getActiveBusinessCookie();

  if (
    cookie?.userId === ownerId &&
    businesses.some((business) => business.id === cookie.businessId)
  ) {
    return (
      businesses.find((business) => business.id === cookie.businessId) ?? businesses[0] ?? null
    );
  }

  return businesses[0] ?? null;
}

export async function listBusinessesForOwner(ownerId: string): Promise<BusinessProfileData[]> {
  const businesses = await prisma.business.findMany({
    where: { ownerId },
    orderBy: { createdAt: "asc" },
  });

  return businesses.map(mapBusiness);
}

export async function getOwnedBusinessById(
  ownerId: string,
  businessId: string,
): Promise<BusinessProfileData | null> {
  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId },
  });

  return business ? mapBusiness(business) : null;
}

export async function isBusinessOnboardingCompleted(businessId: string): Promise<boolean> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { onboardingCompleted: true },
  });

  return Boolean(business?.onboardingCompleted);
}

export async function getOrCreateBusinessForOwner(ownerId: string): Promise<BusinessProfileData> {
  const existing = await getPrimaryBusinessByOwnerId(ownerId);

  if (existing) {
    return mapBusiness(existing);
  }

  const business = await prisma.business.create({
    data: {
      ownerId,
      ...DEFAULT_BUSINESS_VALUES,
    },
  });

  const { ensureTenantPlatformDefaults } = await import("@/services/tenant-platform.service");
  await ensureTenantPlatformDefaults(business.id);

  return mapBusiness(business);
}

export async function updateOnboardingStep(
  ownerId: string,
  step: number,
): Promise<BusinessProfileData> {
  const business = await getPrimaryBusinessByOwnerId(ownerId);

  if (!business) {
    throw new Error("Business not found for user");
  }

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: { onboardingStep: step },
  });

  return mapBusiness(updated);
}

export async function updateBusinessMeetYourAi(
  ownerId: string,
  data: { ownerName?: string | null; aiName: string },
): Promise<BusinessProfileData> {
  const business = await getPrimaryBusinessByOwnerId(ownerId);

  if (!business) {
    throw new Error("Business not found for user");
  }

  const ownerName = data.ownerName?.trim() || null;
  const aiName = data.aiName.trim();

  if (!aiName) {
    throw new Error("AI name is required");
  }

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: {
      ownerName,
      aiName,
    },
  });

  return mapBusiness(updated);
}

export async function updateBusinessAiPersonality(
  ownerId: string,
  aiPersonality: string,
): Promise<BusinessProfileData> {
  const business = await getPrimaryBusinessByOwnerId(ownerId);

  if (!business) {
    throw new Error("Business not found for user");
  }

  const personality = aiPersonality.trim();

  if (!personality) {
    throw new Error("AI personality is required");
  }

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: { aiPersonality: personality },
  });

  return mapBusiness(updated);
}

export interface BusinessInterviewUpdateInput {
  businessName?: string;
  businessType?: BusinessType;
  country?: string;
  businessGoal?: string;
  businessDna?: Record<string, unknown>;
}

export async function updateBusinessInterview(
  ownerId: string,
  data: BusinessInterviewUpdateInput,
): Promise<BusinessProfileData> {
  const business = await getPrimaryBusinessByOwnerId(ownerId);

  if (!business) {
    throw new Error("Business not found for user");
  }

  const existingDna = (business.businessDna as BusinessDna) ?? {};
  const hasDnaUpdates = data.businessDna !== undefined && Object.keys(data.businessDna).length > 0;
  const mergedDna = hasDnaUpdates ? { ...existingDna, ...data.businessDna } : existingDna;

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: {
      ...(data.businessName !== undefined && {
        businessName: data.businessName.trim() || null,
      }),
      ...(data.businessType !== undefined && { businessType: data.businessType }),
      ...(data.country !== undefined && { country: data.country.trim() || null }),
      ...(data.businessGoal !== undefined && { businessGoal: data.businessGoal.trim() || null }),
      ...(hasDnaUpdates && { businessDna: mergedDna as Prisma.InputJsonValue }),
    },
  });

  return mapBusiness(updated);
}

export async function updateBusinessGoal(
  ownerId: string,
  businessGoal: string,
): Promise<BusinessProfileData> {
  const business = await getPrimaryBusinessByOwnerId(ownerId);

  if (!business) {
    throw new Error("Business not found for user");
  }

  const goal = businessGoal.trim();

  if (!goal) {
    throw new Error("Business goal is required");
  }

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: { businessGoal: goal },
  });

  return mapBusiness(updated);
}

export async function completeOnboarding(ownerId: string): Promise<BusinessProfileData> {
  const business = await getPrimaryBusinessByOwnerId(ownerId);

  if (!business) {
    throw new Error("Business not found for user");
  }

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: {
      onboardingCompleted: true,
      onboardingStep: ONBOARDING_TOTAL_STEPS,
    },
  });

  return mapBusiness(updated);
}

export async function finalizeOnboardingAtCurrentStep(
  ownerId: string,
): Promise<BusinessProfileData> {
  const business = await getPrimaryBusinessByOwnerId(ownerId);

  if (!business) {
    throw new Error("Business not found for user");
  }

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: {
      onboardingCompleted: true,
    },
  });

  return mapBusiness(updated);
}

export async function isOnboardingCompleted(ownerId: string): Promise<boolean> {
  const business = await getPrimaryBusinessByOwnerId(ownerId);

  return business?.onboardingCompleted ?? false;
}
