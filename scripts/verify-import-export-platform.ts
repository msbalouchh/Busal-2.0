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
  EXPORT_FORMATS,
  IMPORT_EXPORT_PLATFORM_ROUTES,
  IMPORT_FORMATS,
  SUPPORTED_MODULES,
} from "../src/modules/import-export-platform/constants/routes";
import { splitIntoBatches } from "../src/modules/import-export-platform/engine/batch-engine";
import { detectDuplicates } from "../src/modules/import-export-platform/engine/duplicate-engine";
import {
  parseImportContent,
  serializeExportContent,
} from "../src/modules/import-export-platform/engine/format-engine";
import { buildDefaultFieldMappings } from "../src/modules/import-export-platform/engine/mapping-engine";
import {
  buildCronExpression,
  calculateJobProgress,
  resolveNextScheduleRun,
} from "../src/modules/import-export-platform/engine/progress-engine";
import {
  canRollbackImport,
  resolveRollbackProgress,
} from "../src/modules/import-export-platform/engine/rollback-engine";
import { validateImportRows } from "../src/modules/import-export-platform/engine/validation-engine";
import {
  ensureBootstrapImportExportPlatform,
  getDefaultSchemaCount,
} from "../src/modules/import-export-platform/plugins/bootstrap-import-export-platform";
import {
  isImportExportSchemaRegistered,
  listImportExportSchemaDefinitions,
} from "../src/modules/import-export-platform/registry/schema-registry";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import {
  createImportExportSchedule,
  createImportTemplate,
  ensureImportExportPlatformDefaults,
  getImportExportApiPayload,
  getImportExportPlatformDashboard,
  listImportExportPlatformAuditLogs,
  logImportExportDashboardAccess,
  previewImportJob,
  registerModuleImportExportSchema,
  rollbackImportJob,
  runExportJob,
  runImportJob,
  triggerScheduledJob,
} from "../src/services/import-export-platform.service";
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
    "src/modules/import-export-platform/index.ts",
    "src/modules/import-export-platform/constants/routes.ts",
    "src/modules/import-export-platform/types/import-export-platform-types.ts",
    "src/modules/import-export-platform/registry/schema-registry.ts",
    "src/modules/import-export-platform/engine/format-engine.ts",
    "src/modules/import-export-platform/engine/mapping-engine.ts",
    "src/modules/import-export-platform/engine/validation-engine.ts",
    "src/modules/import-export-platform/engine/duplicate-engine.ts",
    "src/modules/import-export-platform/engine/batch-engine.ts",
    "src/modules/import-export-platform/engine/progress-engine.ts",
    "src/modules/import-export-platform/engine/rollback-engine.ts",
    "src/modules/import-export-platform/plugins/bootstrap-import-export-platform.ts",
    "src/modules/import-export-platform/utils/import-export-platform-utils.ts",
    "src/modules/import-export-platform/lib/get-import-export-platform-context.ts",
    "src/modules/import-export-platform/actions/import-export-platform-actions.ts",
    "src/modules/import-export-platform/components/import-export-platform-dashboard.tsx",
    "src/modules/import-export-platform/components/import-export-platform-lists.tsx",
    "src/modules/import-export-platform/components/import-export-platform-nav.tsx",
    "src/services/import-export-platform.service.ts",
    "src/app/api/import-export/[schemaKey]/route.ts",
    "src/app/dashboard/import-export-platform/page.tsx",
    "src/app/dashboard/import-export-platform/imports/page.tsx",
    "src/app/dashboard/import-export-platform/exports/page.tsx",
    "src/app/dashboard/import-export-platform/templates/page.tsx",
    "src/app/dashboard/import-export-platform/schedules/page.tsx",
    "src/app/dashboard/import-export-platform/history/page.tsx",
    "src/app/dashboard/import-export-platform/registry/page.tsx",
    "src/app/dashboard/import-export-platform/audit/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Import export platform routes");
  assert(
    IMPORT_EXPORT_PLATFORM_ROUTES.overview === "/dashboard/import-export-platform",
    "Overview route mismatch",
  );
  assert(SUPPORTED_MODULES.length === 13, "Expected 13 supported modules");
  assert(IMPORT_FORMATS.length === 3, "Expected 3 import formats");
  assert(EXPORT_FORMATS.length === 4, "Expected 4 export formats");
  console.log("  PASS");

  console.log("Permission protected");
  const permissionsSource = readFileSync(
    join(root, "src/modules/authorization/constants/permissions.ts"),
    "utf8",
  );
  assert(
    permissionsSource.includes("import_export_platform.view"),
    "import_export_platform.view missing",
  );
  assert(
    permissionsSource.includes("import_export_platform.admin"),
    "import_export_platform.admin missing",
  );
  assert(
    ALL_PERMISSION_CODES.includes(PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_MANAGE),
    "Permission code missing",
  );
  console.log("  PASS");

  console.log("Schema");
  const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schema.includes("model ImportExportSchema"), "ImportExportSchema missing");
  assert(schema.includes("model ImportExportTemplate"), "ImportExportTemplate missing");
  assert(schema.includes("model ImportExportJob"), "ImportExportJob missing");
  assert(schema.includes("model ImportExportJobRecord"), "ImportExportJobRecord missing");
  assert(schema.includes("model ImportExportSchedule"), "ImportExportSchedule missing");
  assert(
    schema.includes("model ImportExportPlatformAuditLog"),
    "ImportExportPlatformAuditLog missing",
  );
  console.log("  PASS");

  console.log("Registry bootstrap");
  ensureBootstrapImportExportPlatform();
  const schemas = listImportExportSchemaDefinitions();
  assert(schemas.length === getDefaultSchemaCount(), "Default schemas not registered");
  assert(isImportExportSchemaRegistered("customers"), "customers schema missing");
  assert(isImportExportSchemaRegistered("menu"), "menu schema missing");
  assert(isImportExportSchemaRegistered("ai-knowledge"), "ai-knowledge schema missing");
  console.log("  PASS");

  console.log("Format engine");
  const csvRows = parseImportContent("CSV", "name,email\nAlice,alice@example.com");
  assert(csvRows.length === 1, "CSV parse failed");
  assert(csvRows[0]?.name === "Alice", "CSV field parse failed");
  const jsonRows = parseImportContent("JSON", '[{"name":"Bob","email":"bob@example.com"}]');
  assert(jsonRows.length === 1, "JSON parse failed");
  const exported = serializeExportContent(
    "CSV",
    [{ name: "Alice", email: "alice@example.com" }],
    [
      { key: "name", label: "Name", type: "string" },
      { key: "email", label: "Email", type: "email" },
    ],
  );
  assert(exported.content.includes("Alice"), "CSV export failed");
  console.log("  PASS");

  console.log("Validation engine");
  const validation = validateImportRows(
    [{ name: "", email: "invalid" }],
    [
      { key: "name", label: "Name", type: "string", required: true },
      { key: "email", label: "Email", type: "email" },
    ],
  );
  assert(!validation.valid, "Validation should fail");
  assert(validation.errors.length >= 2, "Validation errors missing");
  console.log("  PASS");

  console.log("Duplicate engine");
  const duplicateResult = detectDuplicates(
    [
      { email: "a@example.com", name: "A" },
      { email: "a@example.com", name: "B" },
    ],
    [{ key: "email", label: "Email", type: "email", uniqueKey: true }],
  );
  assert(duplicateResult.duplicates === 1, "Duplicate detection failed");
  console.log("  PASS");

  console.log("Mapping engine");
  const mappings = buildDefaultFieldMappings(
    ["Name", "Email"],
    [
      { key: "name", label: "Name", type: "string" },
      { key: "email", label: "Email", type: "email" },
    ],
  );
  assert(mappings.length === 2, "Default mappings failed");
  console.log("  PASS");

  console.log("Batch engine");
  assert(splitIntoBatches([1, 2, 3, 4, 5], 2).length === 3, "Batch split failed");
  console.log("  PASS");

  console.log("Progress engine");
  assert(calculateJobProgress(5, 0, 0, 10) === 50, "Progress calculation failed");
  assert(buildCronExpression("DAILY") === "0 2 * * *", "Cron expression failed");
  assert(resolveNextScheduleRun("DAILY") > new Date(), "Next schedule run failed");
  console.log("  PASS");

  console.log("Rollback engine");
  assert(canRollbackImport("COMPLETED", 3), "Rollback eligibility failed");
  assert(resolveRollbackProgress(10, 5) === 50, "Rollback progress failed");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  assert(business, "No business found");
  const platform = await buildPlatformContext(business.id);

  await prisma.importExportSchema.deleteMany({
    where: { businessId: business.id, schemaKey: { startsWith: "custom.verify" } },
  });

  console.log("Import export platform defaults");
  await ensureImportExportPlatformDefaults(business.id);
  const schemaCount = await prisma.importExportSchema.count({ where: { businessId: business.id } });
  assert(schemaCount >= getDefaultSchemaCount(), "Default schemas not seeded");
  console.log("  PASS");

  console.log("Register module schema");
  await registerModuleImportExportSchema(business.id, {
    schemaKey: "custom.verify_schema",
    module: "verify-module",
    name: "Verify Schema",
    fields: [{ key: "value", label: "Value", type: "string", required: true }],
    importFormats: ["CSV", "JSON"],
    exportFormats: ["CSV", "JSON"],
    isActive: true,
  });
  assert(
    isImportExportSchemaRegistered("custom.verify_schema"),
    "Custom schema registration failed",
  );
  console.log("  PASS");

  console.log("Create import template");
  const template = await createImportTemplate(platform, {
    schemaKey: "customers",
    name: "custom.verify_template",
    format: "CSV",
    fieldMappings: [{ sourceField: "Name", targetField: "name" }],
    isDefault: true,
  });
  assert(template.id, "Template creation failed");
  console.log("  PASS");

  console.log("Preview import job");
  const preview = await previewImportJob(platform, {
    schemaKey: "customers",
    format: "CSV",
    content: "name,email\nAlice,alice@example.com\nBob,bob@example.com",
    fileName: "customers.csv",
  });
  assert(preview.previewRows.length >= 1, "Preview rows missing");
  assert(preview.totalRecords === 2, "Preview total records failed");
  console.log("  PASS");

  console.log("Run import job");
  const importResult = await runImportJob(platform, {
    schemaKey: "customers",
    format: "CSV",
    content: "name,email\nAlice,alice@example.com\nBob,bob@example.com\nAlice,alice@example.com",
    fileName: "customers.csv",
  });
  assert(importResult.successCount >= 1, "Import success count failed");
  console.log("  PASS");

  console.log("Run export job");
  const exportResult = await runExportJob(platform, {
    schemaKey: "customers",
    format: "JSON",
    records: [
      { name: "Alice", email: "alice@example.com" },
      { name: "Bob", email: "bob@example.com" },
    ],
  });
  assert(exportResult.content.includes("Alice"), "Export content failed");
  console.log("  PASS");

  console.log("API import");
  const apiImport = await runImportJob(platform, {
    schemaKey: "customers",
    format: "JSON",
    content: '[{"name":"Charlie","email":"charlie@example.com"}]',
    source: "API",
  });
  assert(apiImport.jobId, "API import failed");
  console.log("  PASS");

  console.log("API export");
  const apiExport = await runExportJob(platform, {
    schemaKey: "customers",
    format: "CSV",
    source: "API",
    records: [{ name: "Delta", email: "delta@example.com" }],
  });
  assert(apiExport.jobId, "API export failed");
  console.log("  PASS");

  console.log("Rollback import job");
  const rollback = await rollbackImportJob(platform, importResult.jobId);
  assert(rollback.rolledBack >= 1, "Rollback failed");
  console.log("  PASS");

  console.log("Create schedule");
  const schedule = await createImportExportSchedule(platform, {
    schemaKey: "customers",
    name: "custom.verify_schedule",
    jobType: "EXPORT",
    format: "CSV",
    frequency: "DAILY",
  });
  assert(schedule.id, "Schedule creation failed");
  console.log("  PASS");

  console.log("Trigger scheduled job");
  const triggered = await triggerScheduledJob(platform, schedule.id);
  assert(triggered.jobId, "Scheduled job trigger failed");
  console.log("  PASS");

  console.log("Import export API payload");
  const apiPayload = await getImportExportApiPayload(business.id, "customers");
  assert(apiPayload.schemaKey === "customers", "API payload schema key failed");
  assert(Array.isArray(apiPayload.fields), "API payload fields missing");
  console.log("  PASS");

  console.log("Import export platform dashboard");
  const dashboard = await getImportExportPlatformDashboard(business.id);
  assert(dashboard.totalSchemas >= getDefaultSchemaCount() + 1, "Dashboard schemas missing");
  assert(dashboard.totalImportJobs >= 2, "Dashboard import jobs missing");
  assert(dashboard.totalExportJobs >= 2, "Dashboard export jobs missing");
  console.log("  PASS");

  console.log("Dashboard access audit");
  await logImportExportDashboardAccess(platform, "overview");
  console.log("  PASS");

  console.log("Audit logs");
  const auditLogs = await listImportExportPlatformAuditLogs(business.id);
  assert(
    auditLogs.some((entry) => entry.eventType === "SCHEMA_REGISTERED"),
    "Schema registered audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "TEMPLATE_CREATED"),
    "Template created audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "IMPORT_PREVIEW"),
    "Import preview audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "IMPORT_COMPLETED"),
    "Import completed audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "EXPORT_COMPLETED"),
    "Export completed audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "IMPORT_ROLLED_BACK"),
    "Import rolled back audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "SCHEDULE_CREATED"),
    "Schedule created audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "SCHEDULE_TRIGGERED"),
    "Schedule triggered audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "DUPLICATE_DETECTED"),
    "Duplicate detected audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "BATCH_PROCESSED"),
    "Batch processed audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "API_IMPORT"),
    "API import audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "API_EXPORT"),
    "API export audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "NOTIFICATION_SENT"),
    "Notification sent audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "DASHBOARD_ACCESS"),
    "Dashboard access audit missing",
  );
  console.log("  PASS");

  console.log("\nData Import & Export Platform verification passed.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
