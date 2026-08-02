import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import { COMMERCIAL_PLATFORM_ROUTES } from "../src/modules/commercial-platform/constants/commercial-platform";
import {
  getCommercialPlatformBundle,
  listCommercialLeadsForVerification,
  queryCommercialLeads,
} from "../src/services/commercial-platform-module.service";
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
  console.log("Commercial platform module structure");
  const moduleFiles = [
    "src/modules/commercial-platform/index.ts",
    "src/modules/commercial-platform/constants/commercial-platform.ts",
    "src/modules/commercial-platform/types/commercial-platform-types.ts",
    "src/modules/commercial-platform/lib/get-commercial-platform-context.ts",
    "src/modules/commercial-platform/actions/commercial-platform-actions.ts",
    "src/modules/commercial-platform/components/commercial-platform-overview.tsx",
    "src/modules/commercial-platform/components/commercial-leads-panel.tsx",
    "src/modules/commercial-platform/components/commercial-customers-panel.tsx",
    "src/services/commercial-platform-module.service.ts",
    "src/app/dashboard/commercial-platform/page.tsx",
    "src/app/dashboard/commercial-platform/leads/page.tsx",
    "src/app/dashboard/commercial-platform/quotes/page.tsx",
    "src/app/dashboard/commercial-platform/revenue/page.tsx",
  ];

  for (const file of moduleFiles) {
    read(file);
  }
  console.log("  PASS");

  console.log("Permission-aware guards");
  const contextLoader = read(
    "src/modules/commercial-platform/lib/get-commercial-platform-context.ts",
  );
  assert(contextLoader.includes("PERMISSION_CODES.SALES_VIEW"), "SALES_VIEW guard missing");
  assert(contextLoader.includes("PERMISSION_CODES.QUOTES_VIEW"), "QUOTES_VIEW guard missing");
  const actions = read("src/modules/commercial-platform/actions/commercial-platform-actions.ts");
  assert(actions.includes("protectedAction"), "protectedAction missing");
  assert(actions.includes("PERMISSION_CODES.SALES_UPDATE"), "SALES_UPDATE action missing");
  console.log("  PASS");

  console.log("Dashboard routes");
  for (const route of Object.values(COMMERCIAL_PLATFORM_ROUTES)) {
    assert(route.startsWith("/dashboard"), `Invalid route: ${route}`);
  }
  console.log("  PASS");

  console.log("Live commercial platform workflow");
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  assert(business, "No business found for verification");

  const platform = await buildPlatformContext(business.id);
  const bundle = await getCommercialPlatformBundle(platform);

  assert(typeof bundle.permissions.canViewLeads === "boolean", "Permission flags missing");
  assert(typeof bundle.widgets.openLeads === "number", "Dashboard widgets missing");

  const leadCount = await listCommercialLeadsForVerification(platform);
  assert(leadCount >= 0, "Lead listing failed");

  const directory = await queryCommercialLeads(platform, { page: 1, pageSize: 5 });
  assert(Array.isArray(directory.items), "Lead directory missing");

  console.log("  PASS");

  console.log("\nCommercial platform verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
