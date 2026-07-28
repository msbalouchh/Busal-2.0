import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import {
  ALL_PERMISSION_CODES,
  PERMISSION_CODES,
} from "../src/modules/authorization/constants/permissions";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import {
  LOCALIZATION_PLATFORM_ROUTES,
  RTL_LANGUAGE_CODES,
  SUPPORTED_LANGUAGE_CODES,
} from "../src/modules/localization-platform/constants/routes";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatTime,
} from "../src/modules/localization-platform/engine/formatting-engine";
import {
  isRtlLanguage,
  resolveEffectiveLanguage,
  resolveTextDirection,
} from "../src/modules/localization-platform/engine/locale-engine";
import { resolveTranslationValue } from "../src/modules/localization-platform/engine/translation-engine";
import {
  buildNextTranslationVersion,
  canRollbackTranslation,
} from "../src/modules/localization-platform/engine/version-engine";
import {
  ensureBootstrapLocalizationPlatform,
  getDefaultTranslationKeyCount,
} from "../src/modules/localization-platform/plugins/bootstrap-localization-platform";
import {
  isTranslationKeyRegistered,
  listTranslationKeyDefinitions,
} from "../src/modules/localization-platform/registry/translation-key-registry";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import {
  ensureLocalizationPlatformDefaults,
  getLocalizationApiPayload,
  getLocalizationPlatformDashboard,
  listLocalizationPlatformAuditLogs,
  loadLanguagePack,
  logLocalizationDashboardAccess,
  registerModuleTranslationKey,
  resolveLocalizationContext,
  setBranchLanguageOverride,
  setBusinessLanguage,
  setUserLanguagePreference,
  translate,
  upsertScopeSetting,
  upsertTranslation,
} from "../src/services/localization-platform.service";
import { mapProfileToAuthUser } from "../src/services/user.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function buildPlatformContext(businessId: string): Promise<BusinessContext> {
  const businessRecord = await prisma.business.findUnique({
    where: { id: businessId },
    include: { owner: true },
  });

  assert(businessRecord?.owner, "Business owner missing");

  const business = await getOwnedBusinessById(businessRecord.ownerId, businessId);
  assert(business, "Business profile missing");

  const user = mapProfileToAuthUser(
    businessRecord.owner.id,
    businessRecord.owner.email,
    businessRecord.owner,
    {},
  );
  const authorization = await resolveAuthorizationContext(user, business);

  return {
    user,
    business,
    branch: null,
    branchId: null,
    roleSlug: authorization.roleSlug,
    permissions: Array.from(authorization.permissions),
    authorization,
    staffSession: null,
    isOwner: authorization.isOwner,
    accessibleBusinesses: [
      { id: business.id, name: business.businessName ?? "Business", isOnboarded: true },
    ],
    accessibleBranches: [],
  };
}

async function main() {
  console.log("Module structure");
  const moduleFiles = [
    "src/modules/localization-platform/index.ts",
    "src/modules/localization-platform/constants/routes.ts",
    "src/modules/localization-platform/types/localization-platform-types.ts",
    "src/modules/localization-platform/registry/translation-key-registry.ts",
    "src/modules/localization-platform/engine/locale-engine.ts",
    "src/modules/localization-platform/engine/translation-engine.ts",
    "src/modules/localization-platform/engine/formatting-engine.ts",
    "src/modules/localization-platform/engine/version-engine.ts",
    "src/modules/localization-platform/plugins/bootstrap-localization-platform.ts",
    "src/modules/localization-platform/utils/localization-platform-utils.ts",
    "src/modules/localization-platform/lib/get-localization-platform-context.ts",
    "src/modules/localization-platform/actions/localization-platform-actions.ts",
    "src/modules/localization-platform/components/localization-platform-dashboard.tsx",
    "src/modules/localization-platform/components/localization-platform-lists.tsx",
    "src/modules/localization-platform/components/localization-platform-nav.tsx",
    "src/services/localization-platform.service.ts",
    "src/app/api/localization/[languageCode]/route.ts",
    "src/app/dashboard/localization-platform/page.tsx",
    "src/app/dashboard/localization-platform/languages/page.tsx",
    "src/app/dashboard/localization-platform/translations/page.tsx",
    "src/app/dashboard/localization-platform/preferences/page.tsx",
    "src/app/dashboard/localization-platform/formatting/page.tsx",
    "src/app/dashboard/localization-platform/versions/page.tsx",
    "src/app/dashboard/localization-platform/registry/page.tsx",
    "src/app/dashboard/localization-platform/audit/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Localization platform routes");
  assert(
    LOCALIZATION_PLATFORM_ROUTES.overview === "/dashboard/localization-platform",
    "Overview route mismatch",
  );
  assert(LOCALIZATION_PLATFORM_ROUTES.registry.includes("registry"), "Registry route missing");
  assert(SUPPORTED_LANGUAGE_CODES.length === 5, "Expected 5 supported languages");
  assert(RTL_LANGUAGE_CODES.length === 2, "Expected 2 RTL languages");
  console.log("  PASS");

  console.log("Permission protected");
  const permissionsSource = readFileSync(
    join(root, "src/modules/authorization/constants/permissions.ts"),
    "utf8",
  );
  assert(
    permissionsSource.includes("localization_platform.view"),
    "localization_platform.view missing",
  );
  assert(
    permissionsSource.includes("localization_platform.admin"),
    "localization_platform.admin missing",
  );
  assert(
    ALL_PERMISSION_CODES.includes(PERMISSION_CODES.LOCALIZATION_PLATFORM_MANAGE),
    "Permission code missing",
  );
  console.log("  PASS");

  console.log("Schema");
  const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schema.includes("model LocalizationLanguage"), "LocalizationLanguage missing");
  assert(schema.includes("model LocalizationTranslationKey"), "LocalizationTranslationKey missing");
  assert(schema.includes("model LocalizationTranslation"), "LocalizationTranslation missing");
  assert(
    schema.includes("model LocalizationTranslationVersion"),
    "LocalizationTranslationVersion missing",
  );
  assert(schema.includes("model LocalizationScopeSetting"), "LocalizationScopeSetting missing");
  assert(
    schema.includes("model LocalizationPlatformAuditLog"),
    "LocalizationPlatformAuditLog missing",
  );
  console.log("  PASS");

  console.log("Registry bootstrap");
  ensureBootstrapLocalizationPlatform();
  const keys = listTranslationKeyDefinitions();
  assert(keys.length === getDefaultTranslationKeyCount(), "Default keys not registered");
  assert(isTranslationKeyRegistered("common.save"), "common.save missing");
  assert(isTranslationKeyRegistered("notifications.title"), "notifications.title missing");
  assert(isTranslationKeyRegistered("communication.title"), "communication.title missing");
  assert(isTranslationKeyRegistered("settings.title"), "settings.title missing");
  assert(isTranslationKeyRegistered("ai.title"), "ai.title missing");
  console.log("  PASS");

  console.log("Locale engine");
  assert(
    resolveEffectiveLanguage({ branchLanguage: "ar", userLanguage: "fr" }) === "ar",
    "Branch override failed",
  );
  assert(
    resolveEffectiveLanguage({ userLanguage: "fr", businessLanguage: "es" }) === "fr",
    "User preference failed",
  );
  assert(isRtlLanguage("ar"), "Arabic should be RTL");
  assert(!isRtlLanguage("en"), "English should be LTR");
  assert(resolveTextDirection("ur") === "RTL", "Urdu direction failed");
  console.log("  PASS");

  console.log("Translation engine");
  const resolved = resolveTranslationValue({
    key: "common.save",
    languageCode: "fr",
    fallbackLanguageCode: "en",
    translations: { en: "Save", fr: "Enregistrer" },
    defaultValue: "Save",
  });
  assert(resolved.value === "Enregistrer", "Translation resolution failed");
  const fallback = resolveTranslationValue({
    key: "common.save",
    languageCode: "es",
    fallbackLanguageCode: "en",
    translations: { en: "Save" },
    defaultValue: "Save",
  });
  assert(fallback.usedFallback, "Fallback flag missing");
  assert(fallback.value === "Save", "Fallback value failed");
  console.log("  PASS");

  console.log("Formatting engine");
  const sampleDate = new Date("2026-07-28T14:30:00.000Z");
  assert(formatDate(sampleDate, "en-US", "yyyy-MM-dd") === "2026-07-28", "Date format failed");
  assert(formatTime(sampleDate, "en-US", "HH:mm") === "14:30", "Time format failed");
  assert(formatNumber(1234.56, "en-US").includes("1"), "Number format failed");
  assert(formatCurrency(99.5, "en-US", "USD").includes("99"), "Currency format failed");
  console.log("  PASS");

  console.log("Version engine");
  assert(buildNextTranslationVersion(2) === 3, "Version increment failed");
  assert(canRollbackTranslation(2), "Rollback check failed");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  assert(business, "No business found");
  const platform = await buildPlatformContext(business.id);

  await prisma.localizationTranslationKey.deleteMany({
    where: { businessId: business.id, key: { startsWith: "custom.verify" } },
  });
  await prisma.localizationScopeSetting.deleteMany({
    where: {
      businessId: business.id,
      scopeIdentifier: { startsWith: "custom.verify" },
    },
  });

  console.log("Localization platform defaults");
  await ensureLocalizationPlatformDefaults(business.id);
  const languageCount = await prisma.localizationLanguage.count();
  assert(languageCount >= 5, "Languages not seeded");
  const keyCount = await prisma.localizationTranslationKey.count({
    where: { businessId: business.id },
  });
  assert(keyCount >= getDefaultTranslationKeyCount(), "Default keys not seeded");
  console.log("  PASS");

  console.log("Register module translation key");
  await registerModuleTranslationKey(business.id, {
    key: "custom.verify_key",
    module: "verify-module",
    defaultValue: "Verify Key",
    translations: { ar: "تحقق" },
    isActive: true,
  });
  assert(isTranslationKeyRegistered("custom.verify_key"), "Custom key registration failed");
  console.log("  PASS");

  console.log("Upsert translation with versioning");
  const updated = await upsertTranslation(platform, {
    key: "custom.verify_key",
    languageCode: "fr",
    value: "Cle Verify",
    changeReason: "Verify localization",
  });
  assert(updated.version >= 1, "Translation version missing");
  console.log("  PASS");

  console.log("Load language pack");
  const pack = await loadLanguagePack(platform, {
    languageCode: "es",
    translations: {
      "custom.verify_key": "Clave Verify",
      "common.save": "Guardar",
    },
  });
  assert(pack.loadedCount >= 1, "Language pack load failed");
  console.log("  PASS");

  console.log("Translate with fallback");
  const french = await translate(platform, "common.save", "fr");
  assert(french.value.length > 0, "French translation failed");
  const missing = await translate(platform, "custom.verify_missing", "es");
  assert(missing.usedFallback, "Missing key fallback failed");
  console.log("  PASS");

  console.log("User language preference");
  await setUserLanguagePreference(platform, "fr");
  const userContext = await resolveLocalizationContext(platform);
  assert(userContext.languageCode === "fr", "User language preference failed");
  console.log("  PASS");

  console.log("Business language");
  await setBusinessLanguage(platform, "es");
  await setUserLanguagePreference(platform, "en");
  const businessContext = await resolveLocalizationContext(platform);
  assert(businessContext.languageCode === "en", "User should override business language");
  console.log("  PASS");

  console.log("Branch language override");
  await setBranchLanguageOverride(platform, "custom.verify_branch", "ar");
  const branchPlatform: BusinessContext = {
    ...platform,
    branchId: "custom.verify_branch",
  };
  const branchContext = await resolveLocalizationContext(branchPlatform);
  assert(branchContext.languageCode === "ar", "Branch override failed");
  assert(branchContext.direction === "RTL", "Branch RTL failed");
  console.log("  PASS");

  console.log("Regional settings");
  await upsertScopeSetting(platform, {
    scopeType: "BUSINESS",
    scopeIdentifier: business.id,
    timezone: "Asia/Karachi",
    currencyCode: "PKR",
    countryCode: "PK",
    numberFormat: "ur-PK",
  });
  const regionalContext = await resolveLocalizationContext(platform);
  assert(regionalContext.timezone === "Asia/Karachi", "Timezone update failed");
  assert(regionalContext.currencyCode === "PKR", "Currency update failed");
  assert(regionalContext.countryCode === "PK", "Country update failed");
  console.log("  PASS");

  console.log("Localization API payload");
  const apiPayload = await getLocalizationApiPayload(business.id, "ar");
  assert(apiPayload.languageCode === "ar", "API payload language failed");
  assert(
    Object.keys(apiPayload.translations).length >= getDefaultTranslationKeyCount(),
    "API payload missing keys",
  );
  assert(apiPayload.supportedLanguages.length === 5, "Supported languages missing");
  console.log("  PASS");

  console.log("Localization platform dashboard");
  const dashboard = await getLocalizationPlatformDashboard(business.id);
  assert(dashboard.totalLanguages >= 5, "Dashboard languages missing");
  assert(
    dashboard.totalTranslationKeys >= getDefaultTranslationKeyCount() + 1,
    "Dashboard keys missing",
  );
  console.log("  PASS");

  console.log("Dashboard access audit");
  await logLocalizationDashboardAccess(platform, "overview");
  console.log("  PASS");

  console.log("Audit logs");
  const auditLogs = await listLocalizationPlatformAuditLogs(business.id);
  assert(
    auditLogs.some((entry) => entry.eventType === "KEY_REGISTERED"),
    "Key registered audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "TRANSLATION_UPDATED"),
    "Translation updated audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "VERSION_PUBLISHED"),
    "Version published audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "PACK_LOADED"),
    "Pack loaded audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "PREFERENCE_UPDATED"),
    "Preference updated audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "DASHBOARD_ACCESS"),
    "Dashboard access audit missing",
  );
  console.log("  PASS");

  console.log("\nMulti-language & Localization Platform verification passed.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
