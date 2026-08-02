import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { BUSINESS_PROFILE_ROUTES } from "../src/modules/business/constants/business-profile";
import { getBusinessProfileSettingCount } from "../src/modules/business/plugins/bootstrap-business-settings";
import {
  getBusinessProfileBundle,
  updateBusinessAddress,
  updateBusinessProfile,
} from "../src/services/business-profile-module.service";
import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import { mapProfileToAuthUser } from "../src/services/user.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
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
  console.log("Business profile module structure");
  const moduleFiles = [
    "src/modules/business/index.ts",
    "src/modules/business/types/business-profile-types.ts",
    "src/modules/business/constants/business-profile.ts",
    "src/modules/business/plugins/bootstrap-business-settings.ts",
    "src/modules/business/lib/get-business-profile-context.ts",
    "src/modules/business/actions/business-profile-actions.ts",
    "src/modules/business/components/business-profile-form.tsx",
    "src/modules/business/components/business-address-form.tsx",
    "src/modules/business/components/business-contact-form.tsx",
    "src/modules/business/components/business-branding-panel.tsx",
    "src/modules/business/components/business-settings-panel.tsx",
    "src/modules/business/components/business-branches-panel.tsx",
    "src/services/business-profile-module.service.ts",
    "src/app/dashboard/business/profile/page.tsx",
    "src/app/dashboard/business/address/page.tsx",
    "src/app/dashboard/business/branding/page.tsx",
    "src/app/api/platform-files/[fileId]/route.ts",
  ];

  for (const file of moduleFiles) {
    read(file);
  }
  console.log("  PASS");

  console.log("Permission-aware page guards");
  const contextLoader = read("src/modules/business/lib/get-business-profile-context.ts");
  assert(contextLoader.includes("protectedPage"), "protectedPage missing");
  assert(contextLoader.includes("PERMISSION_CODES.BUSINESS_VIEW"), "BUSINESS_VIEW guard missing");
  console.log("  PASS");

  console.log("Protected actions");
  const actions = read("src/modules/business/actions/business-profile-actions.ts");
  assert(actions.includes("protectedAction"), "protectedAction missing");
  assert(actions.includes("PERMISSION_CODES.BUSINESS_UPDATE"), "BUSINESS_UPDATE action missing");
  assert(actions.includes("PERMISSION_CODES.BRANCH_MANAGE"), "BRANCH_MANAGE action missing");
  assert(actions.includes("PERMISSION_CODES.FILES_UPLOAD"), "FILES_UPLOAD action missing");
  console.log("  PASS");

  console.log("Dashboard routes");
  for (const route of Object.values(BUSINESS_PROFILE_ROUTES)) {
    assert(route.startsWith("/dashboard/business"), `Invalid route: ${route}`);
  }
  console.log("  PASS");

  console.log("Settings engine integration");
  assert(getBusinessProfileSettingCount() >= 7, "Business profile settings not registered");
  console.log("  PASS");

  console.log("Live business profile workflow");
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true`,
  );

  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, businessName: true },
  });

  assert(business, "No business found for verification");

  const platform = await buildPlatformContext(business.id);
  const bundle = await getBusinessProfileBundle(platform);

  assert(bundle.profile.id === business.id, "Profile id mismatch");
  assert(typeof bundle.profile.canEdit === "boolean", "Permission flags missing");

  const updatedProfile = await updateBusinessProfile(platform, {
    businessName: business.businessName?.trim() || "Verify Business",
    legalName: "Verify Legal Name",
    businessType: "RESTAURANT",
    industry: "FOOD_BEVERAGE",
    description: "Verification business profile",
    ownerName: "Verify Owner",
    timezone: "UTC",
    currency: "GBP",
    language: "en-GB",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
  });

  assert(updatedProfile.businessName.length > 0, "Profile update failed");

  const updatedAddress = await updateBusinessAddress(platform, {
    country: "United Kingdom",
    addressLine1: "1 Verify Street",
    addressLine2: "",
    city: "London",
    state: "Greater London",
    postalCode: "SW1A 1AA",
    mapsLocation: null,
  });

  assert(updatedAddress.address.city === "London", "Address update failed");
  console.log("  PASS");

  console.log("\nBusiness profile verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
