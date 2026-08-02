import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { createCommunicationChannel } from "../src/services/communication-channel-manager.service";
import { sendCommunicationMessage } from "../src/services/communication-message.service";
import { listCommunicationProviders } from "../src/services/communication-provider-manager.service";
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
  console.log("Communication Platform module structure");
  const moduleFiles = [
    "src/modules/communication-platform-management/index.ts",
    "src/modules/communication-platform-management/constants/routes.ts",
    "src/modules/communication-platform-management/lib/get-communication-platform-context.ts",
    "src/modules/communication-platform-management/actions/communication-platform-actions.ts",
    "src/services/communication-channel-manager.service.ts",
    "src/services/communication-template-manager.service.ts",
    "src/services/communication-message.service.ts",
    "src/services/communication-campaign-manager.service.ts",
    "src/services/communication-queue-manager.service.ts",
    "src/services/communication-delivery-manager.service.ts",
    "src/services/communication-retry-manager.service.ts",
    "src/services/communication-analytics.service.ts",
    "src/services/communication-provider-manager.service.ts",
    "src/services/communications/interfaces/email-provider.interface.ts",
    "src/app/app/communications/page.tsx",
    "src/app/app/communications/inbox/page.tsx",
    "prisma/migrations/20250731170000_communication_platform/migration.sql",
    "prisma/migrations/20250731170100_communication_platform_permissions/migration.sql",
  ];

  for (const file of moduleFiles) read(file);

  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes(PERMISSION_CODES.COMMUNICATION_VIEW), "COMMUNICATION_VIEW missing");
  assert(
    permissions.includes(PERMISSION_CODES.COMMUNICATION_CREATE),
    "COMMUNICATION_CREATE missing",
  );
  assert(permissions.includes(PERMISSION_CODES.COMMUNICATION_SEND), "COMMUNICATION_SEND missing");
  assert(
    permissions.includes(PERMISSION_CODES.COMMUNICATION_MANAGE),
    "COMMUNICATION_MANAGE missing",
  );
  assert(
    permissions.includes(PERMISSION_CODES.COMMUNICATION_DELETE),
    "COMMUNICATION_DELETE missing",
  );

  const schema = read("prisma/schema.prisma");
  assert(
    schema.includes("model PlatformCommunicationChannel"),
    "PlatformCommunicationChannel missing",
  );
  assert(
    schema.includes("model PlatformCommunicationMessage"),
    "PlatformCommunicationMessage missing",
  );

  assert(listCommunicationProviders().length >= 8, "Provider placeholders incomplete");

  const business = await prisma.business.findFirst({ select: { id: true, ownerId: true } });
  assert(business, "No business found");

  const profile = await getOwnedBusinessById(business.ownerId, business.id);
  assert(profile, "Business profile missing");

  const ownerId = business.ownerId;
  const channel = await createCommunicationChannel(ownerId, {
    name: "Verify Email Channel",
    type: "EMAIL",
  });
  assert(channel.id, "Channel creation failed");

  const message = await sendCommunicationMessage(ownerId, {
    channel: "EMAIL",
    recipient: "verify@example.com",
    subject: "Verify",
    content: "Communication platform verification",
  });
  assert(message.status === "DELIVERED", "Message delivery simulation failed");

  console.log("Communication Platform verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
