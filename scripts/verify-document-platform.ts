import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { createDocument } from "../src/services/document.service";
import { validateDocumentChecksum } from "../src/services/document-version-manager.service";
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
  console.log("Document Platform module structure");
  const moduleFiles = [
    "src/modules/document-platform-management/index.ts",
    "src/services/document.service.ts",
    "src/services/document-folder.service.ts",
    "src/services/document-template.service.ts",
    "src/services/document-version-manager.service.ts",
    "src/services/document-export-manager.service.ts",
    "src/services/document-pdf-generator.service.ts",
    "src/app/app/documents/page.tsx",
    "src/app/app/documents/library/page.tsx",
    "prisma/migrations/20250731180000_document_platform/migration.sql",
    "prisma/migrations/20250731180100_document_platform_permissions/migration.sql",
  ];

  for (const file of moduleFiles) read(file);

  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes(PERMISSION_CODES.DOCUMENT_VIEW), "DOCUMENT_VIEW missing");
  assert(permissions.includes(PERMISSION_CODES.DOCUMENT_CREATE), "DOCUMENT_CREATE missing");
  assert(permissions.includes(PERMISSION_CODES.DOCUMENT_EXPORT), "DOCUMENT_EXPORT missing");

  const schema = read("prisma/schema.prisma");
  assert(schema.includes("model PlatformDocument"), "PlatformDocument missing");
  assert(schema.includes("model PlatformDocumentVersion"), "PlatformDocumentVersion missing");

  const business = await prisma.business.findFirst({ select: { id: true, ownerId: true } });
  assert(business, "No business found");

  const profile = await getOwnedBusinessById(business.ownerId, business.id);
  assert(profile, "Business profile missing");

  const ownerId = business.ownerId;
  const document = await createDocument(ownerId, {
    name: "Verify Invoice",
    slug: `verify-invoice-${Date.now()}`,
    documentType: "INVOICE",
    content: '{"type":"invoice","number":"INV-001"}',
  });
  assert(document?.id, "Document creation failed");

  const checksum = await validateDocumentChecksum(ownerId, document.id);
  assert(checksum.valid, "Checksum validation failed");

  console.log("Document Platform verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
