import "server-only";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";
import { prisma } from "@/lib/prisma";
import type { BusinessProfileData } from "@/types/business-profile";
import type { AuthUser } from "@/types/auth";

function mapBusinessRecord(business: {
  id: string;
  ownerId: string;
  ownerName: string | null;
  businessName: string | null;
  businessType: BusinessProfileData["businessType"];
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
    businessType: business.businessType,
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

function buildOperatorAuthUser(operator: ControlCenterOperatorContext): AuthUser {
  return {
    id: operator.userId,
    email: operator.email,
    fullName: operator.fullName,
    role: "owner",
    tenantId: null,
  };
}

function buildTenantPlatformAuthorization(
  user: AuthUser,
  business: BusinessProfileData & { id: string },
): AuthorizationContext {
  const permissions = new Set<string>([
    PERMISSION_CODES.TENANT_PLATFORM_VIEW,
    PERMISSION_CODES.TENANT_PLATFORM_MANAGE,
    PERMISSION_CODES.TENANT_PLATFORM_ADMIN,
  ]);

  return {
    user,
    business,
    permissions,
    roleSlug: "control-center-operator",
    isOwner: false,
  };
}

export async function buildOperatorTenantPlatformContext(
  operator: ControlCenterOperatorContext,
  businessId: string,
): Promise<BusinessContext> {
  const businessRecord = await prisma.business.findUnique({
    where: { id: businessId },
  });

  if (!businessRecord) {
    throw new Error("Business not found");
  }

  const business = mapBusinessRecord(businessRecord);
  const user = buildOperatorAuthUser(operator);
  const authorization = buildTenantPlatformAuthorization(user, business);

  return {
    user,
    business,
    branch: null,
    branchId: null,
    roleSlug: authorization.roleSlug,
    permissions: Array.from(authorization.permissions),
    authorization,
    staffSession: null,
    isOwner: false,
    accessibleBusinesses: [
      {
        id: business.id,
        name: business.businessName ?? "Business",
        isOnboarded: business.onboardingCompleted,
      },
    ],
    accessibleBranches: [],
  };
}
