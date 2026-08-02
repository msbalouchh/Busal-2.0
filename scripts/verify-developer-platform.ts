import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { createApiApplication } from "../src/services/api-application.service";
import { createApiKey, validateApiKey } from "../src/services/api-key-manager.service";
import { handleDeveloperGatewayRequest } from "../src/services/developer-api-gateway.service";
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
  console.log("Developer Platform module structure");
  const moduleFiles = [
    "src/modules/developer-platform-management/index.ts",
    "src/services/api-application.service.ts",
    "src/services/api-key-manager.service.ts",
    "src/services/api-gateway.service.ts",
    "src/app/app/developer/page.tsx",
    "src/app/app/developer/applications/page.tsx",
    "prisma/migrations/20250731180400_developer_platform/migration.sql",
    "prisma/migrations/20250731180500_developer_platform_permissions/migration.sql",
  ];

  for (const file of moduleFiles) read(file);

  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes(PERMISSION_CODES.DEVELOPER_VIEW), "DEVELOPER_VIEW missing");
  assert(permissions.includes(PERMISSION_CODES.DEVELOPER_CREATE), "DEVELOPER_CREATE missing");
  assert(permissions.includes(PERMISSION_CODES.DEVELOPER_MANAGE), "DEVELOPER_MANAGE missing");

  const schema = read("prisma/schema.prisma");
  assert(schema.includes("model PlatformApiApplication"), "PlatformApiApplication missing");
  assert(schema.includes("model PlatformApiRequestLog"), "PlatformApiRequestLog missing");

  const business = await prisma.business.findFirst({ select: { id: true, ownerId: true } });
  assert(business, "No business found");

  const profile = await getOwnedBusinessById(business.ownerId, business.id);
  assert(profile, "Business profile missing");

  const ownerId = business.ownerId;
  const application = await createApiApplication(ownerId, {
    name: "Verify App",
    description: "Verification application",
  });
  assert(application?.id, "Application creation failed");

  const keyResult = await createApiKey(ownerId, {
    applicationId: application.id,
    name: "Verify Key",
    permissions: ["orders.read"],
  });
  assert(keyResult?.rawKey, "API key creation failed");

  const validated = await validateApiKey(keyResult.rawKey);
  assert(validated?.id, "API key validation failed");

  const gateway = await handleDeveloperGatewayRequest({
    apiKey: keyResult.rawKey,
    method: "GET",
    path: "/api/v1/orders",
    requiredPermission: "orders.read",
  });
  assert(gateway.statusCode === 200, "Gateway request failed");

  console.log("Developer Platform verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
