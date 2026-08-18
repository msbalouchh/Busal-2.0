import "server-only";

import type { BusinessContactType, BusinessType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { BUSINESS_SETTING_KEYS } from "@/modules/business/constants/business-profile";
import { ensureBootstrapBusinessProfileSettings } from "@/modules/business/plugins/bootstrap-business-settings";
import type {
  BusinessAddressUpdateInput,
  BusinessAssetUploadInput,
  BusinessBrandingUpdateInput,
  BusinessContactUpdateInput,
  BusinessProfileBundle,
  BusinessProfileUpdateInput,
  BusinessSettingsUpdateInput,
  SerializedBusinessProfile,
} from "@/modules/business/types/business-profile-types";
import {
  buildAssetUrl,
  mergeBusinessDna,
  parseBrandingAssets,
  parseBusinessAddress,
  parseOperationalSettings,
  parseRegionalSettings,
  parseSocialLinks,
} from "@/modules/business/utils/business-dna";
import {
  validateBranchName,
  validateBusinessAddressInput,
  validateBusinessAssetUpload,
  validateBusinessBrandingInput,
  validateBusinessProfileInput,
  validateBusinessSettingsInput,
  validateEmail,
} from "@/modules/business/utils/business-profile-validation";
import { ensureFilePlatformDefaults, uploadPlatformFile } from "@/services/file-platform.service";
import { ensureSettingsEngineDefaults } from "@/services/settings-engine.service";
import {
  ensureDefaultBusinessHours,
  ensureMainBranch,
  listBranches,
  listBusinessContacts,
  listBusinessHours,
  type BranchInput,
} from "@/services/business-management.service";
import { ensureBootstrapSettingsEngine } from "@/modules/settings-engine/plugins/bootstrap-settings";
import { resolveConfigurationValue } from "@/modules/settings-engine/engine/config-engine";
import {
  buildScopeIdentifier,
  toStoredConfigValues,
} from "@/modules/settings-engine/engine/inheritance-engine";
import { normalizeEnvironment } from "@/modules/settings-engine/engine/environment-engine";
import { assertValidSettingValue } from "@/modules/settings-engine/engine/validation-engine";
import { getSettingDefinition } from "@/modules/settings-engine/registry/settings-registry";
import type { ConfigurationContext } from "@/modules/settings-engine/types/settings-engine-types";
import type { BusinessProfileData } from "@/types/business-profile";

function mapBusinessRecord(business: {
  id: string;
  ownerId: string;
  ownerName: string | null;
  businessName: string | null;
  businessType: BusinessType | null;
  country: string | null;
  timezone: string | null;
  aiName: string | null;
  aiPersonality: string | null;
  aiAvatarUrl?: string | null;
  aiGreeting?: string | null;
  aiTone?: string | null;
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
}): BusinessProfileData {
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
    aiAvatarUrl: business.aiAvatarUrl ?? null,
    aiGreeting: business.aiGreeting ?? null,
    aiTone: business.aiTone ?? null,
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

async function loadStoredBusinessSettings(businessId: string) {
  ensureBootstrapSettingsEngine();

  const records = await prisma.configSettingValue.findMany({
    where: {
      OR: [{ businessId }, { businessId: null }],
      isDeleted: false,
    },
  });

  return toStoredConfigValues(records);
}

async function loadSettingValue(platform: BusinessContext, key: string): Promise<unknown> {
  const storedValues = await loadStoredBusinessSettings(platform.business.id);
  const context: ConfigurationContext = {
    businessId: platform.business.id,
    branchId: platform.branchId,
    roleSlug: platform.roleSlug,
    userId: platform.user.id,
  };

  const resolved = resolveConfigurationValue({
    key,
    storedValues,
    context,
    environment: normalizeEnvironment(),
  });

  return resolved?.value;
}

async function loadBusinessSettings(platform: BusinessContext) {
  await ensureBootstrapBusinessProfileSettings();
  await ensureSettingsEngineDefaults(platform.business.id);

  const [
    primaryColor,
    secondaryColor,
    timezone,
    language,
    currency,
    dateFormat,
    timeFormat,
    weekStart,
    businessStatus,
    autoConfirmOrders,
    allowOnlineOrdering,
    requireStaffPin,
  ] = await Promise.all([
    loadSettingValue(platform, BUSINESS_SETTING_KEYS.primaryColor),
    loadSettingValue(platform, BUSINESS_SETTING_KEYS.secondaryColor),
    loadSettingValue(platform, BUSINESS_SETTING_KEYS.timezone),
    loadSettingValue(platform, BUSINESS_SETTING_KEYS.locale),
    loadSettingValue(platform, BUSINESS_SETTING_KEYS.currency),
    loadSettingValue(platform, BUSINESS_SETTING_KEYS.dateFormat),
    loadSettingValue(platform, BUSINESS_SETTING_KEYS.timeFormat),
    loadSettingValue(platform, BUSINESS_SETTING_KEYS.weekStart),
    loadSettingValue(platform, BUSINESS_SETTING_KEYS.businessStatus),
    loadSettingValue(platform, BUSINESS_SETTING_KEYS.autoConfirmOrders),
    loadSettingValue(platform, BUSINESS_SETTING_KEYS.allowOnlineOrdering),
    loadSettingValue(platform, BUSINESS_SETTING_KEYS.requireStaffPin),
  ]);

  return {
    primaryColor,
    secondaryColor,
    timezone,
    language,
    currency,
    dateFormat,
    timeFormat,
    weekStart,
    businessStatus,
    autoConfirmOrders,
    allowOnlineOrdering,
    requireStaffPin,
  };
}

async function setBusinessScopedSetting(
  platform: BusinessContext,
  key: string,
  value: unknown,
  changeReason: string,
): Promise<void> {
  ensureBootstrapSettingsEngine();
  await ensureBootstrapBusinessProfileSettings();

  const definition = getSettingDefinition(key);
  if (!definition) {
    throw new Error(`Unknown configuration key: ${key}`);
  }

  assertValidSettingValue(definition, value);

  const environment = normalizeEnvironment();
  const context: ConfigurationContext = {
    businessId: platform.business.id,
    branchId: platform.branchId,
    roleSlug: platform.roleSlug,
    userId: platform.user.id,
  };
  const scopeIdentifier = buildScopeIdentifier("BUSINESS", context);

  if (!scopeIdentifier) {
    throw new Error(`Unable to resolve scope identifier for ${key}`);
  }

  const existing = await prisma.configSettingValue.findUnique({
    where: {
      definitionKey_scope_environment_scopeIdentifier: {
        definitionKey: key,
        scope: "BUSINESS",
        environment,
        scopeIdentifier,
      },
    },
  });

  if (existing) {
    await prisma.configSettingValue.update({
      where: { id: existing.id },
      data: {
        value: value as Prisma.InputJsonValue,
        currentVersion: existing.currentVersion + 1,
        changedById: platform.user.id,
        changeReason,
        isDeleted: false,
      },
    });
    return;
  }

  await prisma.configSettingValue.create({
    data: {
      definitionKey: key,
      scope: "BUSINESS",
      environment,
      scopeIdentifier,
      businessId: platform.business.id,
      branchId: platform.branchId,
      roleSlug: platform.roleSlug,
      value: value as Prisma.InputJsonValue,
      changedById: platform.user.id,
      changeReason,
    },
  });
}

function buildPermissions(platform: BusinessContext) {
  const permissions = platform.authorization.permissions;

  return {
    canEdit: platform.isOwner || hasPermission(permissions, PERMISSION_CODES.BUSINESS_UPDATE),
    canManageBranding:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.BUSINESS_UPDATE),
    canManageSettings:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.SETTINGS_EDIT),
    canManageBranches:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.BRANCH_MANAGE),
  };
}

export async function getBusinessProfileBundle(
  platform: BusinessContext,
): Promise<BusinessProfileBundle> {
  await ensureMainBranch(platform.business.id);
  await ensureDefaultBusinessHours(platform.business.id);

  const businessRecord = await prisma.business.findUnique({
    where: { id: platform.business.id },
  });

  if (!businessRecord) {
    throw new Error("Business not found");
  }

  const business = mapBusinessRecord(businessRecord);
  const [branches, hours, contacts, settings] = await Promise.all([
    listBranches(platform.business.id),
    listBusinessHours(platform.business.id),
    listBusinessContacts(platform.business.id),
    loadBusinessSettings(platform),
  ]);

  const dna = business.businessDna ?? {};
  const permissions = buildPermissions(platform);

  const profile: SerializedBusinessProfile = {
    id: business.id,
    businessName: business.businessName?.trim() || "",
    legalName: typeof dna.legalName === "string" ? dna.legalName : "",
    businessType: (business.businessType as BusinessType | null) ?? null,
    industry: typeof dna.industry === "string" ? dna.industry : "",
    description: typeof dna.description === "string" ? dna.description : "",
    ownerName: business.ownerName,
    branding: parseBrandingAssets(dna, settings),
    regional: parseRegionalSettings(business.timezone, settings),
    operational: parseOperationalSettings(settings),
    address: parseBusinessAddress(dna, business.country ?? ""),
    supportEmail: typeof dna.supportEmail === "string" ? dna.supportEmail : "",
    socialLinks: parseSocialLinks(dna),
    contacts,
    branches,
    hours,
    ...permissions,
  };

  return { business, profile };
}

export async function updateBusinessProfile(
  platform: BusinessContext,
  input: BusinessProfileUpdateInput,
): Promise<SerializedBusinessProfile> {
  validateBusinessProfileInput(input);

  const businessRecord = await prisma.business.findUnique({
    where: { id: platform.business.id },
  });

  if (!businessRecord) {
    throw new Error("Business not found");
  }

  const existingDna = (businessRecord.businessDna as Record<string, unknown>) ?? {};

  await prisma.business.update({
    where: { id: platform.business.id },
    data: {
      businessName: input.businessName.trim(),
      businessType: input.businessType,
      timezone: input.timezone.trim(),
      ownerName: input.ownerName.trim() || null,
      businessDna: mergeBusinessDna(existingDna, {
        legalName: input.legalName.trim(),
        industry: input.industry.trim(),
        description: input.description.trim(),
      }) as Prisma.InputJsonValue,
    },
  });

  await Promise.all([
    setBusinessScopedSetting(
      platform,
      BUSINESS_SETTING_KEYS.timezone,
      input.timezone,
      "Business profile update",
    ),
    setBusinessScopedSetting(
      platform,
      BUSINESS_SETTING_KEYS.currency,
      input.currency,
      "Business profile update",
    ),
    setBusinessScopedSetting(
      platform,
      BUSINESS_SETTING_KEYS.locale,
      input.language,
      "Business profile update",
    ),
    setBusinessScopedSetting(
      platform,
      BUSINESS_SETTING_KEYS.dateFormat,
      input.dateFormat,
      "Business profile update",
    ),
    setBusinessScopedSetting(
      platform,
      "general.business_name",
      input.businessName.trim(),
      "Business profile update",
    ),
  ]);

  const bundle = await getBusinessProfileBundle(platform);
  return bundle.profile;
}

export async function updateBusinessAddress(
  platform: BusinessContext,
  input: BusinessAddressUpdateInput,
): Promise<SerializedBusinessProfile> {
  validateBusinessAddressInput(input);

  const businessRecord = await prisma.business.findUnique({
    where: { id: platform.business.id },
  });

  if (!businessRecord) {
    throw new Error("Business not found");
  }

  const existingDna = (businessRecord.businessDna as Record<string, unknown>) ?? {};

  await prisma.business.update({
    where: { id: platform.business.id },
    data: {
      country: input.country.trim(),
      businessDna: mergeBusinessDna(existingDna, {
        address: {
          country: input.country.trim(),
          addressLine1: input.addressLine1.trim(),
          addressLine2: input.addressLine2.trim(),
          city: input.city.trim(),
          state: input.state.trim(),
          postalCode: input.postalCode.trim(),
          mapsLocation: input.mapsLocation?.trim() || null,
        },
      }) as Prisma.InputJsonValue,
    },
  });

  const bundle = await getBusinessProfileBundle(platform);
  return bundle.profile;
}

export async function updateBusinessContactInformation(
  platform: BusinessContext,
  input: BusinessContactUpdateInput,
): Promise<SerializedBusinessProfile> {
  validateEmail(input.email, "email");
  validateEmail(input.supportEmail, "support email");

  const businessRecord = await prisma.business.findUnique({
    where: { id: platform.business.id },
  });

  if (!businessRecord) {
    throw new Error("Business not found");
  }

  const existingDna = (businessRecord.businessDna as Record<string, unknown>) ?? {};

  await prisma.business.update({
    where: { id: platform.business.id },
    data: {
      businessDna: mergeBusinessDna(existingDna, {
        supportEmail: input.supportEmail.trim(),
        socialLinks: input.socialLinks,
      }) as Prisma.InputJsonValue,
    },
  });

  const existingContacts = await listBusinessContacts(platform.business.id);
  const managedTypes = new Set(["EMAIL", "PHONE", "WEBSITE"]);

  for (const contact of input.contacts) {
    if (!contact.value.trim()) {
      continue;
    }

    const existing = contact.id
      ? existingContacts.find((entry) => entry.id === contact.id)
      : undefined;

    if (existing) {
      await prisma.businessContact.update({
        where: { id: existing.id },
        data: {
          type: contact.type,
          label: contact.label?.trim() || null,
          value: contact.value.trim(),
          isPrimary: contact.isPrimary ?? false,
        },
      });
    } else {
      await prisma.businessContact.create({
        data: {
          businessId: platform.business.id,
          type: contact.type,
          label: contact.label?.trim() || null,
          value: contact.value.trim(),
          isPrimary: contact.isPrimary ?? false,
        },
      });
    }
  }

  for (const field of [
    { type: "EMAIL" as BusinessContactType, value: input.email, label: "Email" },
    { type: "PHONE" as BusinessContactType, value: input.phone, label: "Phone" },
    { type: "WEBSITE" as BusinessContactType, value: input.website, label: "Website" },
  ]) {
    if (!field.value.trim()) {
      continue;
    }

    const existing = existingContacts.find(
      (contact) => contact.type === field.type && managedTypes.has(contact.type),
    );

    if (existing) {
      await prisma.businessContact.update({
        where: { id: existing.id },
        data: { value: field.value.trim(), label: field.label },
      });
    } else {
      await prisma.businessContact.create({
        data: {
          businessId: platform.business.id,
          type: field.type,
          label: field.label,
          value: field.value.trim(),
          isPrimary: field.type === "EMAIL",
        },
      });
    }
  }

  const bundle = await getBusinessProfileBundle(platform);
  return bundle.profile;
}

export async function updateBusinessBranding(
  platform: BusinessContext,
  input: BusinessBrandingUpdateInput,
): Promise<SerializedBusinessProfile> {
  validateBusinessBrandingInput(input);

  await Promise.all([
    setBusinessScopedSetting(
      platform,
      BUSINESS_SETTING_KEYS.primaryColor,
      input.primaryColor,
      "Branding update",
    ),
    setBusinessScopedSetting(
      platform,
      BUSINESS_SETTING_KEYS.secondaryColor,
      input.secondaryColor,
      "Branding update",
    ),
  ]);

  const bundle = await getBusinessProfileBundle(platform);
  return bundle.profile;
}

export async function updateBusinessSettingsPreferences(
  platform: BusinessContext,
  input: BusinessSettingsUpdateInput,
): Promise<SerializedBusinessProfile> {
  validateBusinessSettingsInput(input);

  await Promise.all([
    setBusinessScopedSetting(
      platform,
      BUSINESS_SETTING_KEYS.weekStart,
      input.weekStart,
      "Business settings update",
    ),
    setBusinessScopedSetting(
      platform,
      BUSINESS_SETTING_KEYS.businessStatus,
      input.businessStatus,
      "Business settings update",
    ),
    setBusinessScopedSetting(
      platform,
      BUSINESS_SETTING_KEYS.autoConfirmOrders,
      input.autoConfirmOrders,
      "Business settings update",
    ),
    setBusinessScopedSetting(
      platform,
      BUSINESS_SETTING_KEYS.allowOnlineOrdering,
      input.allowOnlineOrdering,
      "Business settings update",
    ),
    setBusinessScopedSetting(
      platform,
      BUSINESS_SETTING_KEYS.requireStaffPin,
      input.requireStaffPin,
      "Business settings update",
    ),
  ]);

  const bundle = await getBusinessProfileBundle(platform);
  return bundle.profile;
}

export async function uploadBusinessAsset(
  platform: BusinessContext,
  input: BusinessAssetUploadInput,
): Promise<SerializedBusinessProfile> {
  validateBusinessAssetUpload(input);
  await ensureFilePlatformDefaults(platform.business.id);

  const content = Buffer.from(input.contentBase64, "base64");
  const upload = await uploadPlatformFile(platform, {
    module: "business",
    entityType: input.assetType,
    entityId: platform.business.id,
    originalName: input.originalName,
    mimeType: input.mimeType,
    content,
    tags: ["business-profile", input.assetType],
    metadata: { assetType: input.assetType },
    changeNotes: `Business ${input.assetType} upload`,
  });

  const businessRecord = await prisma.business.findUnique({
    where: { id: platform.business.id },
  });

  if (!businessRecord) {
    throw new Error("Business not found");
  }

  const existingDna = (businessRecord.businessDna as Record<string, unknown>) ?? {};
  const assetUrl = buildAssetUrl(upload.id);
  const dnaPatch: Record<string, unknown> = {};

  if (input.assetType === "logo") {
    dnaPatch.logoFileId = upload.id;
    dnaPatch.logoUrl = assetUrl;
  } else if (input.assetType === "cover") {
    dnaPatch.coverFileId = upload.id;
    dnaPatch.coverUrl = assetUrl;
  } else {
    dnaPatch.faviconFileId = upload.id;
    dnaPatch.faviconUrl = assetUrl;
  }

  await prisma.business.update({
    where: { id: platform.business.id },
    data: {
      businessDna: mergeBusinessDna(existingDna, dnaPatch) as Prisma.InputJsonValue,
    },
  });

  const bundle = await getBusinessProfileBundle(platform);
  return bundle.profile;
}

export async function createBusinessBranch(
  platform: BusinessContext,
  input: BranchInput,
): Promise<SerializedBusinessProfile> {
  const branches = await listBranches(platform.business.id);
  validateBranchName(
    input.name,
    branches.map((branch) => branch.name),
  );

  if (input.isMain) {
    await prisma.branch.updateMany({
      where: { businessId: platform.business.id },
      data: { isMain: false },
    });
  }

  await prisma.branch.create({
    data: {
      businessId: platform.business.id,
      name: input.name.trim(),
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      country: input.country?.trim() || null,
      phone: input.phone?.trim() || null,
      isMain: input.isMain ?? false,
      isActive: true,
    },
  });

  const bundle = await getBusinessProfileBundle(platform);
  return bundle.profile;
}

export async function updateBusinessBranch(
  platform: BusinessContext,
  branchId: string,
  input: BranchInput,
): Promise<SerializedBusinessProfile> {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, businessId: platform.business.id },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }

  const branches = await listBranches(platform.business.id);
  validateBranchName(
    input.name,
    branches.map((entry) => entry.name),
    branch.name,
  );

  if (input.isMain) {
    await prisma.branch.updateMany({
      where: { businessId: platform.business.id },
      data: { isMain: false },
    });
  }

  await prisma.branch.update({
    where: { id: branchId },
    data: {
      name: input.name.trim(),
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      country: input.country?.trim() || null,
      phone: input.phone?.trim() || null,
      isMain: input.isMain ?? branch.isMain,
    },
  });

  const bundle = await getBusinessProfileBundle(platform);
  return bundle.profile;
}

export async function disableBusinessBranch(
  platform: BusinessContext,
  branchId: string,
): Promise<SerializedBusinessProfile> {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, businessId: platform.business.id },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }

  if (branch.isMain) {
    throw new Error("Cannot disable the default branch");
  }

  await prisma.branch.update({
    where: { id: branchId },
    data: { isActive: false },
  });

  const bundle = await getBusinessProfileBundle(platform);
  return bundle.profile;
}

export async function setDefaultBusinessBranch(
  platform: BusinessContext,
  branchId: string,
): Promise<SerializedBusinessProfile> {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, businessId: platform.business.id, isActive: true },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }

  await prisma.branch.updateMany({
    where: { businessId: platform.business.id },
    data: { isMain: false },
  });

  await prisma.branch.update({
    where: { id: branchId },
    data: { isMain: true },
  });

  const bundle = await getBusinessProfileBundle(platform);
  return bundle.profile;
}
