import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { getEnterpriseDashboardOverview } from "../src/services/enterprise-platform-manager.service";
import { createOrganization } from "../src/services/organization-manager.service";
import {
  validatePolicyConfiguration,
  validateProviderConfiguration,
} from "../src/services/enterprise-platform-context.service";
import { getOwnedBusinessById } from "../src/services/business-profile.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

async function main() {
  console.log("Enterprise Platform module structure");
  const moduleFiles = [
    "src/modules/enterprise-platform-management/index.ts",
    "src/services/organization-manager.service.ts",
    "src/services/identity-provider-manager.service.ts",
    "src/services/enterprise-policy-manager.service.ts",
    "src/services/compliance-manager.service.ts",
    "src/app/app/enterprise/page.tsx",
    "src/app/app/enterprise/organizations/page.tsx",
    "prisma/migrations/20250731181000_enterprise_platform/migration.sql",
    "prisma/migrations/20250731181100_enterprise_platform_permissions/migration.sql",
  ];

  for (const file of moduleFiles) read(file);

  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes(PERMISSION_CODES.ENTERPRISE_VIEW), "ENTERPRISE_VIEW missing");
  assert(permissions.includes(PERMISSION_CODES.ORGANIZATION_MANAGE), "ORGANIZATION_MANAGE missing");
  assert(permissions.includes(PERMISSION_CODES.IDENTITY_MANAGE), "IDENTITY_MANAGE missing");
  assert(permissions.includes(PERMISSION_CODES.POLICY_MANAGE), "POLICY_MANAGE missing");

  const schema = read("prisma/schema.prisma");
  assert(
    schema.includes("model PlatformEnterpriseOrganization"),
    "PlatformEnterpriseOrganization missing",
  );
  assert(
    schema.includes("model PlatformEnterpriseIdentityProvider"),
    "PlatformEnterpriseIdentityProvider missing",
  );

  assert(
    validateProviderConfiguration("SAML", { framework: "saml", entityId: "test" }).valid,
    "Provider validation failed",
  );
  assert(
    validatePolicyConfiguration("PASSWORD", { minLength: 12 }).valid,
    "Policy validation failed",
  );

  const business = await prisma.business.findFirst({ select: { id: true, ownerId: true } });
  assert(business, "No business found");

  const profile = await getOwnedBusinessById(business.ownerId, business.id);
  assert(profile, "Business profile missing");

  const ownerId = business.ownerId;
  const org = await createOrganization(ownerId, {
    name: "Verify Enterprise Org",
    slug: `verify-enterprise-${Date.now()}`,
  });
  assert(org?.id, "Organization creation failed");

  const overview = await getEnterpriseDashboardOverview(ownerId);
  assert(overview.organizations.total >= 1, "Dashboard overview missing organizations");

  console.log("Enterprise Platform verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
