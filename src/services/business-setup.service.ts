import "server-only";

import { type BusinessType, type Business, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ensureMainBranch } from "@/services/business-management.service";
import { allocateBusinessCode } from "@/services/business-code.service";
import { getPrimaryBusinessByOwnerId } from "@/services/business-profile.service";
import { ensureTenantPlatformDefaults } from "@/services/tenant-platform.service";

export interface BusinessSetupDraft {
  businessName?: string;
  businessType?: BusinessType;
  industry?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  phone?: string;
  businessEmail?: string;
}

export interface BusinessSetupProfile {
  id: string;
  businessCode: string | null;
  businessName: string | null;
  businessType: BusinessType | null;
  industry: string | null;
  country: string | null;
  currency: string | null;
  timezone: string | null;
  phone: string | null;
  businessEmail: string | null;
  businessSetupCompleted: boolean;
  businessSetupStep: number;
}

function mapBusinessSetupProfile(business: Business): BusinessSetupProfile {
  return {
    id: business.id,
    businessCode: business.businessCode,
    businessName: business.businessName,
    businessType: business.businessType,
    industry: business.industry,
    country: business.country,
    currency: business.currency,
    timezone: business.timezone,
    phone: business.phone,
    businessEmail: business.businessEmail,
    businessSetupCompleted: business.businessSetupCompleted,
    businessSetupStep: business.businessSetupStep,
  };
}

export async function getBusinessSetupProfile(ownerId: string): Promise<BusinessSetupProfile> {
  const business = await getPrimaryBusinessByOwnerId(ownerId);

  if (!business) {
    throw new Error("Business not found for user");
  }

  return mapBusinessSetupProfile(business);
}

export async function isBusinessSetupCompleted(ownerId: string): Promise<boolean> {
  const business = await getPrimaryBusinessByOwnerId(ownerId);
  return Boolean(business?.businessSetupCompleted);
}

export async function updateBusinessSetupStep(
  ownerId: string,
  step: number,
): Promise<BusinessSetupProfile> {
  const business = await getPrimaryBusinessByOwnerId(ownerId);

  if (!business) {
    throw new Error("Business not found for user");
  }

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: { businessSetupStep: step },
  });

  return mapBusinessSetupProfile(updated);
}

export async function saveBusinessSetupDraft(
  ownerId: string,
  draft: BusinessSetupDraft,
  step: number,
): Promise<BusinessSetupProfile> {
  const business = await getPrimaryBusinessByOwnerId(ownerId);

  if (!business) {
    throw new Error("Business not found for user");
  }

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: {
      businessName:
        draft.businessName !== undefined ? draft.businessName.trim() : business.businessName,
      businessType: draft.businessType ?? business.businessType,
      industry: draft.industry !== undefined ? draft.industry.trim() : business.industry,
      country: draft.country !== undefined ? draft.country.trim() : business.country,
      currency: draft.currency !== undefined ? draft.currency.trim() : business.currency,
      timezone: draft.timezone !== undefined ? draft.timezone.trim() : business.timezone,
      phone: draft.phone !== undefined ? draft.phone.trim() : business.phone,
      businessEmail:
        draft.businessEmail !== undefined ? draft.businessEmail.trim() : business.businessEmail,
      businessSetupStep: step,
    },
  });

  return mapBusinessSetupProfile(updated);
}

export interface WorkspaceOnboardingFinalizeInput {
  businessName: string;
  displayName: string;
  businessType: string;
  industry: string;
  country: string;
  timezone: string;
  currency: string;
  defaultBranchName?: string;
  phone?: string;
  businessEmail?: string;
}

function resolveBusinessType(value: string): BusinessType {
  const normalized = value.trim().toUpperCase();
  const allowed = new Set<string>([
    "RESTAURANT",
    "CAFE",
    "BAKERY",
    "GROCERY",
    "RETAIL",
    "SALON",
    "CLINIC",
    "HOTEL",
    "GYM",
    "PHARMACY",
    "SERVICES",
    "OTHER",
  ]);

  return allowed.has(normalized) ? (normalized as BusinessType) : "OTHER";
}

/** Persists workspace wizard output and marks business setup complete. */
export async function finalizeWorkspaceSetup(
  ownerId: string,
  input: WorkspaceOnboardingFinalizeInput,
): Promise<BusinessSetupProfile> {
  const business = await getPrimaryBusinessByOwnerId(ownerId);

  if (!business) {
    throw new Error("Business not found for user");
  }

  if (business.businessSetupCompleted) {
    return mapBusinessSetupProfile(business);
  }

  const businessName = input.displayName.trim() || input.businessName.trim();

  if (!businessName) {
    throw new Error("Business name is required");
  }

  if (!input.country.trim()) {
    throw new Error("Country is required");
  }

  if (!input.currency.trim()) {
    throw new Error("Currency is required");
  }

  if (!input.timezone.trim()) {
    throw new Error("Timezone is required");
  }

  const businessCode = business.businessCode ?? (await allocateBusinessCode());

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.business.update({
      where: { id: business.id },
      data: {
        businessName,
        businessType: resolveBusinessType(input.businessType),
        industry: input.industry.trim() || business.industry,
        country: input.country.trim(),
        currency: input.currency.trim(),
        timezone: input.timezone.trim(),
        phone: input.phone?.trim() || business.phone,
        businessEmail: input.businessEmail?.trim() || business.businessEmail,
        businessCode,
        businessSetupCompleted: true,
        businessSetupStep: 11,
        onboardingCompleted: true,
        onboardingStep: 11,
      },
    });

    await tx.businessMember.upsert({
      where: {
        businessId_userId: {
          businessId: result.id,
          userId: ownerId,
        },
      },
      create: {
        businessId: result.id,
        userId: ownerId,
        role: "OWNER",
        status: "ACTIVE",
      },
      update: {
        role: "OWNER",
        status: "ACTIVE",
      },
    });

    return result;
  });

  const branchName = input.defaultBranchName?.trim() || "Main Branch";
  await ensureMainBranch(updated.id);

  if (branchName !== "Main Branch") {
    await prisma.branch.updateMany({
      where: { businessId: updated.id, isMain: true },
      data: { name: branchName },
    });
  }

  await ensureTenantPlatformDefaults(updated.id);

  return mapBusinessSetupProfile(updated);
}

export async function completeBusinessSetup(ownerId: string): Promise<BusinessSetupProfile> {
  const business = await getPrimaryBusinessByOwnerId(ownerId);

  if (!business) {
    throw new Error("Business not found for user");
  }

  if (business.businessSetupCompleted) {
    return mapBusinessSetupProfile(business);
  }

  if (!business.businessName?.trim()) {
    throw new Error("Business name is required");
  }

  if (!business.businessType) {
    throw new Error("Business type is required");
  }

  if (!business.country?.trim()) {
    throw new Error("Country is required");
  }

  if (!business.currency?.trim()) {
    throw new Error("Currency is required");
  }

  if (!business.timezone?.trim()) {
    throw new Error("Timezone is required");
  }

  const businessCode = business.businessCode ?? (await allocateBusinessCode());

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.business.update({
      where: { id: business.id },
      data: {
        businessCode,
        businessSetupCompleted: true,
        businessSetupStep: 4,
      },
    });

    await tx.businessMember.upsert({
      where: {
        businessId_userId: {
          businessId: result.id,
          userId: ownerId,
        },
      },
      create: {
        businessId: result.id,
        userId: ownerId,
        role: "OWNER",
        status: "ACTIVE",
      },
      update: {
        role: "OWNER",
        status: "ACTIVE",
      },
    });

    return result;
  });

  return mapBusinessSetupProfile(updated);
}

const WORKSPACE_WIZARD_DRAFT_KEY = "workspaceWizardDraft";

export interface WorkspaceWizardDraftSnapshot {
  step: number;
  data: Record<string, unknown>;
}

export async function saveWorkspaceWizardDraft(
  ownerId: string,
  step: number,
  data: Record<string, unknown>,
): Promise<BusinessSetupProfile> {
  const business = await getPrimaryBusinessByOwnerId(ownerId);

  if (!business) {
    throw new Error("Business not found for user");
  }

  const draft: WorkspaceWizardDraftSnapshot = { step, data };

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.business.update({
      where: { id: business.id },
      data: {
        businessName:
          typeof data.displayName === "string" && data.displayName.trim()
            ? data.displayName.trim()
            : typeof data.businessName === "string" && data.businessName.trim()
              ? data.businessName.trim()
              : business.businessName,
        businessType:
          typeof data.businessType === "string"
            ? resolveBusinessType(data.businessType)
            : business.businessType,
        industry:
          typeof data.industry === "string" ? data.industry.trim() : business.industry,
        country: typeof data.country === "string" ? data.country.trim() : business.country,
        currency: typeof data.currency === "string" ? data.currency.trim() : business.currency,
        timezone: typeof data.timezone === "string" ? data.timezone.trim() : business.timezone,
        phone: typeof data.phone === "string" ? data.phone.trim() : business.phone,
        businessEmail:
          typeof data.businessEmail === "string" ? data.businessEmail.trim() : business.businessEmail,
        businessSetupStep: step,
      },
    });

    const settings = await tx.tenantSettings.findUnique({
      where: { businessId: business.id },
      select: { customSettings: true },
    });

    const settingsObject =
      settings?.customSettings &&
      typeof settings.customSettings === "object" &&
      settings.customSettings !== null
        ? (settings.customSettings as Record<string, unknown>)
        : {};

    await tx.tenantSettings.upsert({
      where: { businessId: business.id },
      create: {
        businessId: business.id,
        customSettings: {
          ...settingsObject,
          [WORKSPACE_WIZARD_DRAFT_KEY]: draft,
        } as unknown as Prisma.InputJsonValue,
      },
      update: {
        customSettings: {
          ...settingsObject,
          [WORKSPACE_WIZARD_DRAFT_KEY]: draft,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return result;
  });

  return mapBusinessSetupProfile(updated);
}

export async function loadWorkspaceWizardDraft(
  ownerId: string,
): Promise<WorkspaceWizardDraftSnapshot | null> {
  const business = await getPrimaryBusinessByOwnerId(ownerId);

  if (!business) {
    return null;
  }

  const settings = await prisma.tenantSettings.findUnique({
    where: { businessId: business.id },
    select: { customSettings: true },
  });

  const raw = settings?.customSettings;
  if (!raw || typeof raw !== "object" || raw === null || !(WORKSPACE_WIZARD_DRAFT_KEY in raw)) {
    return null;
  }

  const draft = (raw as Record<string, unknown>)[WORKSPACE_WIZARD_DRAFT_KEY];
  if (!draft || typeof draft !== "object" || draft === null) {
    return null;
  }

  const snapshot = draft as WorkspaceWizardDraftSnapshot;
  if (typeof snapshot.step !== "number" || typeof snapshot.data !== "object" || snapshot.data === null) {
    return null;
  }

  return snapshot;
}
