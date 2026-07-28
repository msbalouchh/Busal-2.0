import { registerImportExportSchemaDefinition } from "@/modules/import-export-platform/registry/schema-registry";
import type { RegisteredImportExportSchemaDefinition } from "@/modules/import-export-platform/types/import-export-platform-types";

const DEFAULT_SCHEMAS: Omit<RegisteredImportExportSchemaDefinition, "isActive">[] = [
  {
    schemaKey: "customers",
    module: "customers",
    name: "Customers",
    fields: [
      { key: "name", label: "Name", type: "string", required: true },
      { key: "email", label: "Email", type: "email", uniqueKey: true },
      { key: "phone", label: "Phone", type: "string" },
    ],
    importFormats: ["CSV", "EXCEL", "JSON"],
    exportFormats: ["CSV", "EXCEL", "JSON", "PDF"],
  },
  {
    schemaKey: "staff",
    module: "staff",
    name: "Staff",
    fields: [
      { key: "fullName", label: "Full Name", type: "string", required: true },
      { key: "email", label: "Email", type: "email", uniqueKey: true },
      { key: "role", label: "Role", type: "string", required: true },
    ],
    importFormats: ["CSV", "EXCEL", "JSON"],
    exportFormats: ["CSV", "EXCEL", "JSON", "PDF"],
  },
  {
    schemaKey: "menu",
    module: "menu",
    name: "Menu Items",
    fields: [
      { key: "name", label: "Name", type: "string", required: true },
      { key: "price", label: "Price", type: "number", required: true },
      { key: "category", label: "Category", type: "string" },
    ],
    importFormats: ["CSV", "EXCEL", "JSON"],
    exportFormats: ["CSV", "EXCEL", "JSON", "PDF"],
  },
  {
    schemaKey: "inventory",
    module: "inventory",
    name: "Inventory",
    fields: [
      { key: "sku", label: "SKU", type: "string", required: true, uniqueKey: true },
      { key: "name", label: "Name", type: "string", required: true },
      { key: "quantity", label: "Quantity", type: "number", required: true },
    ],
    importFormats: ["CSV", "EXCEL", "JSON"],
    exportFormats: ["CSV", "EXCEL", "JSON", "PDF"],
  },
  {
    schemaKey: "orders",
    module: "orders",
    name: "Orders",
    fields: [
      {
        key: "orderNumber",
        label: "Order Number",
        type: "string",
        required: true,
        uniqueKey: true,
      },
      { key: "total", label: "Total", type: "number", required: true },
      { key: "status", label: "Status", type: "string", required: true },
    ],
    importFormats: ["CSV", "EXCEL", "JSON"],
    exportFormats: ["CSV", "EXCEL", "JSON", "PDF"],
  },
  {
    schemaKey: "reservations",
    module: "reservations",
    name: "Reservations",
    fields: [
      { key: "guestName", label: "Guest Name", type: "string", required: true },
      { key: "partySize", label: "Party Size", type: "number", required: true },
      { key: "date", label: "Date", type: "date", required: true },
    ],
    importFormats: ["CSV", "EXCEL", "JSON"],
    exportFormats: ["CSV", "EXCEL", "JSON", "PDF"],
  },
  {
    schemaKey: "crm",
    module: "crm",
    name: "CRM Records",
    fields: [
      { key: "company", label: "Company", type: "string", required: true },
      { key: "contact", label: "Contact", type: "string" },
      { key: "stage", label: "Stage", type: "string" },
    ],
    importFormats: ["CSV", "EXCEL", "JSON"],
    exportFormats: ["CSV", "EXCEL", "JSON", "PDF"],
  },
  {
    schemaKey: "contracts",
    module: "contracts",
    name: "Contracts",
    fields: [
      { key: "title", label: "Title", type: "string", required: true },
      { key: "value", label: "Value", type: "number" },
      { key: "status", label: "Status", type: "string" },
    ],
    importFormats: ["CSV", "EXCEL", "JSON"],
    exportFormats: ["CSV", "EXCEL", "JSON", "PDF"],
  },
  {
    schemaKey: "projects",
    module: "projects",
    name: "Projects",
    fields: [
      { key: "name", label: "Name", type: "string", required: true },
      { key: "owner", label: "Owner", type: "string" },
      { key: "deadline", label: "Deadline", type: "date" },
    ],
    importFormats: ["CSV", "EXCEL", "JSON"],
    exportFormats: ["CSV", "EXCEL", "JSON", "PDF"],
  },
  {
    schemaKey: "files",
    module: "files",
    name: "Files",
    fields: [
      { key: "fileName", label: "File Name", type: "string", required: true },
      { key: "mimeType", label: "MIME Type", type: "string" },
      { key: "sizeBytes", label: "Size (bytes)", type: "number" },
    ],
    importFormats: ["CSV", "EXCEL", "JSON"],
    exportFormats: ["CSV", "EXCEL", "JSON", "PDF"],
  },
  {
    schemaKey: "reports",
    module: "reports",
    name: "Reports",
    fields: [
      { key: "reportName", label: "Report Name", type: "string", required: true },
      { key: "period", label: "Period", type: "string" },
      { key: "total", label: "Total", type: "number" },
    ],
    importFormats: ["CSV", "EXCEL", "JSON"],
    exportFormats: ["CSV", "EXCEL", "JSON", "PDF"],
  },
  {
    schemaKey: "marketplace",
    module: "marketplace",
    name: "Marketplace Listings",
    fields: [
      { key: "listingName", label: "Listing Name", type: "string", required: true },
      { key: "price", label: "Price", type: "number" },
      { key: "category", label: "Category", type: "string" },
    ],
    importFormats: ["CSV", "EXCEL", "JSON"],
    exportFormats: ["CSV", "EXCEL", "JSON", "PDF"],
  },
  {
    schemaKey: "ai-knowledge",
    module: "ai-knowledge",
    name: "AI Knowledge",
    fields: [
      { key: "title", label: "Title", type: "string", required: true },
      { key: "content", label: "Content", type: "string", required: true },
      { key: "tags", label: "Tags", type: "string" },
    ],
    importFormats: ["CSV", "EXCEL", "JSON"],
    exportFormats: ["CSV", "EXCEL", "JSON", "PDF"],
  },
];

let bootstrapped = false;

export function ensureBootstrapImportExportPlatform(): void {
  if (bootstrapped) {
    return;
  }

  for (const schema of DEFAULT_SCHEMAS) {
    registerImportExportSchemaDefinition({ ...schema, isActive: true });
  }

  bootstrapped = true;
}

export function resetBootstrapImportExportPlatform(): void {
  bootstrapped = false;
}

export function getDefaultSchemaCount(): number {
  return DEFAULT_SCHEMAS.length;
}

export const DEFAULT_REGISTERED_SCHEMAS = DEFAULT_SCHEMAS;
